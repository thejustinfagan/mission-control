#!/usr/bin/env bash
# push-live-status.sh — Collects live project data and pushes to Mission Control API
set -euo pipefail

BEAST_MODE_DIR="${BEAST_MODE_DIR:-$HOME/projects/beast-mode}"
PROJECTS_DIR="${PROJECTS_DIR:-$HOME/projects}"
MC_URL="${MC_URL:-https://mission-control-rose-xi.vercel.app}"
MC_TOKEN="${MC_TOKEN:-barry-update-2026}"

TMPDIR_WORK=$(mktemp -d)
trap 'rm -rf "$TMPDIR_WORK"' EXIT

# Collect beast-mode audit data
BEAST_FILE="$TMPDIR_WORK/beast.json"
if [ -x "$BEAST_MODE_DIR/beast-mode-audit.sh" ]; then
  "$BEAST_MODE_DIR/beast-mode-audit.sh" --format=json 2>/dev/null > "$BEAST_FILE" || true
  python3 -c "import json; json.load(open('$BEAST_FILE'))" 2>/dev/null || echo '{}' > "$BEAST_FILE"
else
  echo '{}' > "$BEAST_FILE"
fi

# Scan git repos
PROJECTS_FILE="$TMPDIR_WORK/projects.json"
python3 - "$PROJECTS_DIR" "$PROJECTS_FILE" << 'PYEOF'
import os, json, subprocess, datetime, sys

projects_dir = sys.argv[1]
out_file = sys.argv[2]
results = []

KNOWN = {
    'Battle_Dinghy': {'emoji': '⛵', 'name': 'Battle Dinghy', 'deployment': 'https://battledinghy-production-13ab.up.railway.app/', 'priority': 1},
    'mission-control': {'emoji': '🎛️', 'name': 'Mission Control', 'deployment': 'https://mission-control-rose-xi.vercel.app', 'priority': 2},
    'fleet-intel': {'emoji': '🚛', 'name': 'Fleet Intel', 'deployment': 'https://fleetintel.net', 'priority': 3},
    'beast-mode': {'emoji': '🦁', 'name': 'Beast Mode', 'deployment': '', 'priority': 5},
    'polymarket-bot': {'emoji': '📊', 'name': 'Polymarket Bot', 'deployment': '', 'priority': 4},
    'x-simulator': {'emoji': '🎮', 'name': 'X Simulator', 'deployment': '', 'priority': 6},
    'x-simulator-v2': {'emoji': '🎮', 'name': 'X Simulator v2', 'deployment': '', 'priority': 6},
    'vin-intelligence': {'emoji': '🔍', 'name': 'VIN Intelligence', 'deployment': '', 'priority': 7},
    'reseller-intel': {'emoji': '🏪', 'name': 'Reseller Intel', 'deployment': '', 'priority': 6},
    'battle-dinghy': {'emoji': '⛵', 'name': 'Battle Dinghy (v2)', 'deployment': '', 'priority': 1},
    'openclaw': {'emoji': '🦞', 'name': 'OpenClaw', 'deployment': '', 'priority': 8},
    'polymarket-dashboard': {'emoji': '📈', 'name': 'Polymarket Dashboard', 'deployment': '', 'priority': 4},
    'game-factory': {'emoji': '🏭', 'name': 'Game Factory', 'deployment': '', 'priority': 5},
    'sentinelclaw': {'emoji': '🛡️', 'name': 'SentinelClaw', 'deployment': '', 'priority': 5},
}

for entry in sorted(os.listdir(projects_dir)):
    full = os.path.join(projects_dir, entry)
    git_dir = os.path.join(full, '.git')
    if not os.path.isdir(git_dir):
        continue

    meta = KNOWN.get(entry, {'emoji': '📁', 'name': entry, 'deployment': '', 'priority': 9})

    try:
        last_commit = subprocess.check_output(
            ['git', '-C', full, 'log', '-1', '--format=%aI||%s'],
            stderr=subprocess.DEVNULL, timeout=5
        ).decode().strip()
        parts = last_commit.split('||', 1)
        last_date = parts[0]
        last_msg = parts[1] if len(parts) > 1 else ''
    except:
        last_date = ''
        last_msg = ''

    days_stale = 999
    if last_date:
        try:
            commit_dt = datetime.datetime.fromisoformat(last_date.replace('Z', '+00:00'))
            now = datetime.datetime.now(datetime.timezone.utc)
            days_stale = (now - commit_dt).days
        except:
            pass

    try:
        branch = subprocess.check_output(
            ['git', '-C', full, 'rev-parse', '--abbrev-ref', 'HEAD'],
            stderr=subprocess.DEVNULL, timeout=5
        ).decode().strip()
    except:
        branch = 'unknown'

    try:
        dirty = subprocess.check_output(
            ['git', '-C', full, 'status', '--porcelain'],
            stderr=subprocess.DEVNULL, timeout=5
        ).decode().strip()
        dirty_count = len(dirty.split('\n')) if dirty else 0
    except:
        dirty_count = 0

    if days_stale > 14:
        health = 'stale'
        status = 'stale'
    elif days_stale > 7:
        health = 'degraded'
        status = 'paused'
    else:
        health = 'healthy'
        status = 'active'

    results.append({
        'id': entry,
        'name': meta['name'],
        'emoji': meta['emoji'],
        'status': status,
        'health': health,
        'branch': branch,
        'lastCommitDate': last_date,
        'lastCommitMsg': last_msg,
        'daysSinceCommit': days_stale,
        'dirtyFiles': dirty_count,
        'deployment': meta.get('deployment', ''),
        'priority': meta.get('priority', 9),
    })

results.sort(key=lambda x: (x['priority'], x['name']))

with open(out_file, 'w') as f:
    json.dump(results, f)
PYEOF

# Build payload
PAYLOAD_FILE="$TMPDIR_WORK/payload.json"
python3 - "$BEAST_FILE" "$PROJECTS_FILE" "$PAYLOAD_FILE" << 'PYEOF'
import json, datetime, sys

beast_file, projects_file, out_file = sys.argv[1], sys.argv[2], sys.argv[3]

with open(beast_file) as f:
    beast = json.load(f)
with open(projects_file) as f:
    projects = json.load(f)

active = sum(1 for p in projects if p['status'] == 'active')
stale = sum(1 for p in projects if p['status'] == 'stale')
blocked = sum(1 for p in projects if p.get('health') == 'broken')

payload = {
    'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'summary': {
        'totalProjects': len(projects),
        'activeProjects': active,
        'blockedProjects': blocked,
        'staleProjects': stale,
        'decisionsNeeded': 0,
        'incompleteItems': 0,
    },
    'projects': [{
        'id': p['id'],
        'name': p['name'],
        'emoji': p.get('emoji', '📁'),
        'status': p['status'],
        'health': p['health'],
        'description': f"Branch: {p['branch']} | Last: {p.get('lastCommitMsg','')[:60]}",
        'lastActivity': p.get('lastCommitDate', ''),
        'deployment': p.get('deployment', ''),
        'notes': f"{p['daysSinceCommit']}d since commit, {p['dirtyFiles']} dirty files",
        'blockers': [],
        'priority': p.get('priority', 9),
    } for p in projects[:20]],
    'beastMode': {
        'verdict': beast.get('verdict', 'unavailable'),
        'version': beast.get('version', '?'),
        'repoTotal': int(beast.get('repo_total', 0)),
        'repoHealthy': int(beast.get('repo_healthy', 0)),
        'repoWarning': int(beast.get('repo_warning', 0)),
        'cronTotal': int(beast.get('cron_total', 0)),
        'cronHealthy': int(beast.get('cron_healthy', 0)),
        'liveTotal': int(beast.get('live_total', 0)),
        'liveHealthy': int(beast.get('live_healthy', 0)),
        'allDeltasClear': beast.get('all_deltas_clear', '?'),
    },
    'activities': [
        {'time': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'type': 'audit', 'description': 'Live status push from beast-mode + git scan', 'project': 'mission-control', 'status': 'success'},
    ],
}

with open(out_file, 'w') as f:
    json.dump(payload, f)
PYEOF

# Push to Mission Control
echo "Pushing live status to $MC_URL..."
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' \
  -X POST "$MC_URL/api/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MC_TOKEN" \
  -d @"$PAYLOAD_FILE")

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Status pushed successfully (HTTP $HTTP_CODE)"
  echo "Data summary:"
  python3 -c "
import json
with open('$PAYLOAD_FILE') as f:
    d = json.load(f)
print(f\"  Projects: {len(d['projects'])}\")
print(f\"  Beast Mode: {d['beastMode']['verdict']}\")
print(f\"  Active: {d['summary']['activeProjects']} | Stale: {d['summary']['staleProjects']}\")
"
else
  echo "❌ Push failed (HTTP $HTTP_CODE)"
  exit 1
fi
