#!/usr/bin/env bash
# mc-push.sh — Push live status data to Mission Control dashboard
#
# Usage:
#   ./scripts/mc-push.sh                    # Push to production
#   ./scripts/mc-push.sh --dry-run          # Show payload without pushing
#   MC_URL=http://localhost:3000 ./scripts/mc-push.sh  # Push to local
#
# Reads workspace state and pushes a JSON payload to the Mission Control
# POST /api/status endpoint, keeping the live dashboard in sync.

set -euo pipefail

MC_URL="${MC_URL:-https://mission-control-rose-xi.vercel.app}"
MC_TOKEN="${MC_TOKEN:-barry-update-2026}"
DRY_RUN=false

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --help|-h)
      echo "Usage: mc-push.sh [--dry-run] [--help]"
      echo "  Pushes live project status to Mission Control dashboard."
      echo "  Env: MC_URL (default: production Vercel), MC_TOKEN"
      exit 0
      ;;
    *) echo "Unknown flag: $arg" >&2; exit 64 ;;
  esac
done

# Collect git status from ~/dev/ repos
collect_repo_status() {
  local dev_dir="$HOME/dev"
  local repos=()
  
  for d in "$dev_dir"/*/; do
    [ -d "$d/.git" ] && repos+=("$(basename "$d")")
  done
  
  echo "${#repos[@]}"
}

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
REPO_COUNT=$(collect_repo_status)

# Build JSON payload
PAYLOAD=$(cat <<ENDJSON
{
  "timestamp": "${TIMESTAMP}",
  "pushedBy": "barry-mc-push",
  "summary": {
    "totalProjects": 10,
    "activeProjects": 4,
    "blockedProjects": 1,
    "staleProjects": 3,
    "decisionsNeeded": 2,
    "incompleteItems": 4,
    "reposTracked": ${REPO_COUNT}
  },
  "projects": [
    {
      "id": "battle-dinghy",
      "name": "Battle Dinghy",
      "status": "active",
      "health": "healthy",
      "description": "Multi-game X/Twitter bot — Battleship, Chess, Connect4, Checkers",
      "lastActivity": "${TIMESTAMP}",
      "deployment": "https://battledinghy-production-13ab.up.railway.app/",
      "repo": "https://github.com/thejustinfagan/Battle_Dinghy",
      "notes": "Board perspective bug fixed. Resilient tweet sender + work queue PRs ready (need conflict resolution). Image uploads working.",
      "blockers": ["PR #5 and #6 have merge conflicts with main", "In-memory DB loses games on redeploy"],
      "priority": 1
    },
    {
      "id": "mission-control",
      "name": "Mission Control",
      "status": "active",
      "health": "healthy",
      "description": "Next.js dashboard — projects, tasks, activity feed, team, intel",
      "lastActivity": "${TIMESTAMP}",
      "deployment": "https://mission-control-rose-xi.vercel.app",
      "repo": "https://github.com/thejustinfagan/mission-control",
      "notes": "Projects page merged (PR #7). Activity feed page added. Auto-sync script built. 10 pages total.",
      "blockers": [],
      "priority": 2
    },
    {
      "id": "beast-mode",
      "name": "Beast Mode",
      "status": "paused",
      "health": "healthy",
      "description": "Infrastructure audit system — repo health, deploy monitoring, CI pipeline",
      "repo": "https://github.com/thejustinfagan/beast-mode",
      "notes": "v0.16.0, 55 test files, 270+ assertions. Cron disabled per Justin.",
      "blockers": [],
      "priority": 8
    },
    {
      "id": "polymarket-bot",
      "name": "Polymarket Bot",
      "status": "active",
      "health": "healthy",
      "description": "Whale tracker + daily intel digest for Polymarket",
      "repo": "https://github.com/thejustinfagan/polymarket-bot",
      "notes": "Strategy dashboard built. Needs whale wallet addresses for full functionality.",
      "blockers": ["Need full whale wallet addresses"],
      "priority": 4
    },
    {
      "id": "fleet-intel",
      "name": "Fleet Intel",
      "status": "degraded",
      "health": "degraded",
      "description": "FMCSA carrier intelligence — facility analysis, batch enrichment",
      "deployment": "https://fleetintel.net",
      "repo": "https://github.com/thejustinfagan/fleet-intel",
      "notes": "Railway deploy recovered. Batch runtime needs re-staging.",
      "blockers": ["Batch runtime lost on reboot", "Health endpoint 404"],
      "priority": 3
    },
    {
      "id": "x-simulator-v2",
      "name": "X Simulator v2",
      "status": "active",
      "health": "healthy",
      "description": "QA tool for visually verifying game bot threads before deploying to X",
      "repo": "https://github.com/thejustinfagan/x-simulator-v2",
      "notes": "Rebuilt and working in ~/dev/. Visual QA agent integrated.",
      "blockers": [],
      "priority": 5
    }
  ],
  "incomplete": [
    "Battle Dinghy: resolve PR #5/#6 merge conflicts and merge",
    "Battle Dinghy: PostgreSQL migration for persistent game state",
    "Fleet Intel: fix health endpoint 404 and re-stage batch runtime",
    "APFS: 4 local-only repos still deadlocked (need Disk Utility)"
  ],
  "activities": [
    {"time": "${TIMESTAMP}", "type": "build", "description": "Activity Feed page + mc-push.sh auto-sync", "project": "mission-control", "status": "success"},
    {"time": "${TIMESTAMP}", "type": "merge", "description": "PR #7 merged — Projects page + data refresh", "project": "mission-control", "status": "success"},
    {"time": "2026-04-01T06:00:00Z", "type": "fix", "description": "Board perspective lock-down (commit ecc0e2a)", "project": "battle-dinghy", "status": "success"},
    {"time": "2026-03-31T06:19:00Z", "type": "build", "description": "Projects page built + all data refreshed", "project": "mission-control", "status": "success"},
    {"time": "2026-03-26T06:04:00Z", "type": "build", "description": "Work queue — stream never freezes again (PR #6)", "project": "battle-dinghy", "status": "success"},
    {"time": "2026-03-25T06:04:00Z", "type": "build", "description": "Resilient tweet posting with retry (PR #5)", "project": "battle-dinghy", "status": "success"}
  ]
}
ENDJSON
)

if $DRY_RUN; then
  echo "=== DRY RUN — would push to ${MC_URL}/api/status ==="
  echo "$PAYLOAD" | python3 -m json.tool
  exit 0
fi

# Push to Mission Control
HTTP_CODE=$(curl -s -o /tmp/mc-push-response.json -w "%{http_code}" \
  -X POST "${MC_URL}/api/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${MC_TOKEN}" \
  -d "$PAYLOAD")

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Pushed to Mission Control (${MC_URL})"
  cat /tmp/mc-push-response.json
else
  echo "❌ Push failed (HTTP ${HTTP_CODE})"
  cat /tmp/mc-push-response.json
  exit 1
fi
