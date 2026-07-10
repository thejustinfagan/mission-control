#!/usr/bin/env bash
# Barry feeds Mission Control — run after EVERY action and on heartbeat cron.
#
# Usage:
#   MC_AUTH_TOKEN=... ./scripts/barry-feed-mc.sh --task "Merged PR #3" --project battle-dinghy --type code
#   MC_AUTH_TOKEN=... ./scripts/barry-feed-mc.sh --heartbeat-only --task "Heartbeat check"
#   MC_AUTH_TOKEN=... ./scripts/barry-feed-mc.sh --registry-status "Shipped v2" --project fleet-intel

set -euo pipefail

MC_URL="${MC_URL:-https://web-production-2c48a.up.railway.app}"
AGENT_ID="${AGENT_ID:-barry}"
TASK=""
PROJECT="mission-control"
ACTION_TYPE="work"
HEARTBEAT_ONLY=false
REGISTRY_STATUS=""
REGISTRY_LAST_WORKED=""
REGISTRY_BLOCKERS=""

if [[ -z "${MC_AUTH_TOKEN:-}" ]]; then
  echo "MC_AUTH_TOKEN is required; refusing to send an unauthenticated feed update." >&2
  exit 1
fi

while [[ $# -gt 0 ]]; do
  case "$1" in
    --task) TASK="$2"; shift 2 ;;
    --project) PROJECT="$2"; shift 2 ;;
    --type) ACTION_TYPE="$2"; shift 2 ;;
    --heartbeat-only) HEARTBEAT_ONLY=true; shift ;;
    --registry-status) REGISTRY_STATUS="$2"; shift 2 ;;
    --registry-last-worked) REGISTRY_LAST_WORKED="$2"; shift 2 ;;
    --registry-blockers) REGISTRY_BLOCKERS="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

if [[ -z "$TASK" ]]; then
  TASK="Heartbeat check"
fi

registry_json="[]"
if [[ -n "$REGISTRY_STATUS" || -n "$REGISTRY_LAST_WORKED" || -n "$REGISTRY_BLOCKERS" ]]; then
  blockers_json="[]"
  if [[ -n "$REGISTRY_BLOCKERS" ]]; then
    blockers_json=$(python3 -c "import json; print(json.dumps('$REGISTRY_BLOCKERS'.split(';')))")
  fi
  last_worked="${REGISTRY_LAST_WORKED:-$(date -u +%Y-%m-%d)}"
  status_val="${REGISTRY_STATUS:-$TASK}"
  registry_json=$(python3 -c "
import json
print(json.dumps([{
  'projectId': '$PROJECT',
  'claimedStatus': '''$status_val''',
  'lastWorked': '$last_worked',
  'blockers': $blockers_json,
}]))
")
fi

activity_block=""
if [[ "$HEARTBEAT_ONLY" == "false" ]]; then
  activity_block=$(cat <<EOF
  "activity": {
    "actionType": "$ACTION_TYPE",
    "description": $(python3 -c "import json; print(json.dumps('''$TASK'''))"),
    "project": "$PROJECT",
    "status": "success"
  },
EOF
)
fi

payload=$(cat <<EOF
{
  "agentId": "$AGENT_ID",
  "heartbeat": {
    "ok": true,
    "currentTask": $(python3 -c "import json; print(json.dumps('''$TASK'''))")
  },
$activity_block
  "registry": $registry_json
}
EOF
)

curl -sf -X POST "${MC_URL}/api/agents/feed" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${MC_AUTH_TOKEN}" \
  -d "$payload"

echo ""
echo "Fed Mission Control: agent=$AGENT_ID project=$PROJECT task=$TASK"
