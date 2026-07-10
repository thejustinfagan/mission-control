#!/usr/bin/env bash
# Barry heartbeat push — call from cron every 30 min (8am–9pm) or OpenClaw heartbeat.
#
# Usage:
#   MC_AUTH_TOKEN=your-token ./scripts/push-heartbeat.sh
#   MC_AUTH_TOKEN=your-token MC_URL=https://web-production-2c48a.up.railway.app ./scripts/push-heartbeat.sh

set -euo pipefail

MC_URL="${MC_URL:-https://web-production-2c48a.up.railway.app}"
AGENT_ID="${AGENT_ID:-barry}"
CURRENT_TASK="${CURRENT_TASK:-Heartbeat check}"

if [[ -z "${MC_AUTH_TOKEN:-}" ]]; then
  echo "MC_AUTH_TOKEN is required; refusing to send an unauthenticated heartbeat." >&2
  exit 1
fi

payload=$(cat <<EOF
{
  "agentId": "${AGENT_ID}",
  "ok": true,
  "currentTask": "${CURRENT_TASK}"
}
EOF
)

curl -sf -X POST "${MC_URL}/api/agents/heartbeat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${MC_AUTH_TOKEN}" \
  -d "${payload}"

echo ""
echo "Heartbeat pushed for ${AGENT_ID}"
