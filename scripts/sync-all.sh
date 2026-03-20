#!/usr/bin/env bash
# sync-all.sh — Push live data to Mission Control dashboard
# Syncs: status/projects, schedule/cron, memory files, activities
# Usage: ./scripts/sync-all.sh [--dry-run]
#
# Env: MC_URL (default: https://mission-control-rose-xi.vercel.app)
#      MC_TOKEN (default: barry-update-2026)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MC_URL="${MC_URL:-https://mission-control-rose-xi.vercel.app}"
MC_TOKEN="${MC_TOKEN:-barry-update-2026}"
WORKSPACE="${OPENCLAW_WORKSPACE:-$HOME/.openclaw/workspace}"
PROJECTS_DIR="$HOME/projects"
DRY_RUN=false

[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

log() { printf '[sync] %s\n' "$*" >&2; }

post_json() {
  local endpoint="$1" payload="$2"
  if $DRY_RUN; then
    log "DRY-RUN POST $endpoint ($(echo "$payload" | wc -c | tr -d ' ') bytes)"
    return 0
  fi
  local status
  status=$(curl -s -o /dev/null -w '%{http_code}' \
    -X POST "${MC_URL}${endpoint}" \
    -H "Authorization: Bearer ${MC_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$payload" --max-time 30)
  if [[ "$status" =~ ^2 ]]; then
    log "✅ $endpoint → $status"
    return 0
  else
    log "❌ $endpoint → $status"
    return 1
  fi
}

# ─── 1. Status + Projects ─────────────────────────────────────────────
sync_status() {
  log "Syncing status + projects..."

  # Scan real git repos for live data
  local projects_json
  projects_json=$(python3 "${SCRIPT_DIR}/generate-status-json.py" 2>/dev/null) || {
    log "⚠️  generate-status-json.py failed, using minimal status"
    projects_json='{"timestamp":"'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'","projects":[],"summary":{}}'
  }
  post_json "/api/status" "$projects_json"
}

# ─── 2. Schedule / Cron ───────────────────────────────────────────────
sync_schedule() {
  log "Syncing cron schedule..."

  # Read live cron data from OpenClaw and format for MC
  local schedule_json
  schedule_json=$(python3 "${SCRIPT_DIR}/generate-schedule-json.py" 2>/dev/null) || {
    log "⚠️  generate-schedule-json.py failed, skipping schedule sync"
    return 0
  }
  post_json "/api/schedule" "$schedule_json"
}

# ─── 3. Memory Files ─────────────────────────────────────────────────
sync_memory() {
  log "Syncing memory files..."

  local files_json
  files_json=$(python3 - "$WORKSPACE" <<'PYEOF'
import json, os, sys, datetime

workspace = sys.argv[1]
files = []

# Core files
for name in ["MEMORY.md", "AGENTS.md", "SOUL.md", "USER.md", "INCOMPLETE.md"]:
    fp = os.path.join(workspace, name)
    if os.path.isfile(fp):
        stat = os.stat(fp)
        try:
            content = open(fp, encoding="utf-8", errors="replace").read()
        except:
            content = "(unreadable)"
        files.append({
            "name": name,
            "path": name,
            "size": stat.st_size,
            "modified": datetime.datetime.fromtimestamp(stat.st_mtime, tz=datetime.timezone.utc).isoformat(),
            "content": content[:200000]
        })

# projects/STATUS.md
sp = os.path.join(workspace, "projects", "STATUS.md")
if os.path.isfile(sp):
    stat = os.stat(sp)
    content = open(sp, encoding="utf-8", errors="replace").read()
    files.append({
        "name": "STATUS.md",
        "path": "projects/STATUS.md",
        "size": stat.st_size,
        "modified": datetime.datetime.fromtimestamp(stat.st_mtime, tz=datetime.timezone.utc).isoformat(),
        "content": content[:200000]
    })

# Memory daily files (last 14 days)
mem_dir = os.path.join(workspace, "memory")
if os.path.isdir(mem_dir):
    md_files = sorted([f for f in os.listdir(mem_dir) if f.endswith(".md")], reverse=True)[:14]
    for name in md_files:
        fp = os.path.join(mem_dir, name)
        stat = os.stat(fp)
        try:
            content = open(fp, encoding="utf-8", errors="replace").read()
        except:
            content = "(unreadable)"
        files.append({
            "name": name,
            "path": f"memory/{name}",
            "size": stat.st_size,
            "modified": datetime.datetime.fromtimestamp(stat.st_mtime, tz=datetime.timezone.utc).isoformat(),
            "content": content[:200000]
        })

# memory/MANDATE.md if exists
mandate = os.path.join(mem_dir, "MANDATE.md")
if os.path.isfile(mandate):
    stat = os.stat(mandate)
    content = open(mandate, encoding="utf-8", errors="replace").read()
    files.append({
        "name": "MANDATE.md",
        "path": "memory/MANDATE.md",
        "size": stat.st_size,
        "modified": datetime.datetime.fromtimestamp(stat.st_mtime, tz=datetime.timezone.utc).isoformat(),
        "content": content[:200000]
    })

print(json.dumps({"files": files}))
PYEOF
  ) || {
    log "⚠️  Memory collection failed"
    return 0
  }

  post_json "/api/memory" "$files_json"
}

# ─── 4. Activities ────────────────────────────────────────────────────
sync_activities() {
  log "Syncing recent activities..."

  local activities_json
  activities_json=$(python3 - "$WORKSPACE" "$PROJECTS_DIR" <<'PYEOF'
import json, os, sys, subprocess, datetime

workspace = sys.argv[1]
projects_dir = sys.argv[2]
activities = []
now = datetime.datetime.now(tz=datetime.timezone.utc)

# Scan git repos for recent commits (last 7 days)
if os.path.isdir(projects_dir):
    for name in sorted(os.listdir(projects_dir)):
        git_dir = os.path.join(projects_dir, name, ".git")
        if not os.path.isdir(git_dir):
            continue
        try:
            result = subprocess.run(
                ["git", "log", "--oneline", "--since=7 days ago", "--format=%H|%s|%aI"],
                cwd=os.path.join(projects_dir, name),
                capture_output=True, text=True, timeout=5
            )
            if result.returncode != 0:
                continue
            for line in result.stdout.strip().split("\n"):
                if not line.strip():
                    continue
                parts = line.split("|", 2)
                if len(parts) < 3:
                    continue
                sha, msg, ts = parts
                act_type = "commit"
                if msg.startswith("feat"):
                    act_type = "feature"
                elif msg.startswith("fix"):
                    act_type = "bugfix"
                elif msg.startswith("docs"):
                    act_type = "docs"
                elif msg.startswith("test"):
                    act_type = "test"
                activities.append({
                    "id": sha[:8],
                    "timestamp": ts,
                    "actionType": act_type,
                    "description": msg,
                    "project": name,
                    "status": "completed"
                })
        except:
            continue

# Sort by timestamp descending, limit to 50
activities.sort(key=lambda a: a["timestamp"], reverse=True)
activities = activities[:50]
print(json.dumps(activities))
PYEOF
  ) || {
    log "⚠️  Activities collection failed"
    return 0
  }

  post_json "/api/activities" "$activities_json"
}

# ─── Main ─────────────────────────────────────────────────────────────
main() {
  log "Mission Control sync starting → $MC_URL"
  log "Workspace: $WORKSPACE"
  log "Projects: $PROJECTS_DIR"
  $DRY_RUN && log "*** DRY RUN MODE ***"

  local failed=0
  sync_status || ((failed++)) || true
  sync_schedule || ((failed++)) || true
  sync_memory || ((failed++)) || true
  sync_activities || ((failed++)) || true

  if [[ $failed -eq 0 ]]; then
    log "🎉 All syncs completed successfully"
  else
    log "⚠️  $failed sync(s) had issues"
  fi
  return $failed
}

main "$@"
