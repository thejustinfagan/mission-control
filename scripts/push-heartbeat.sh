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

payload=$(cat <<EOF
{
  "agentId": "${AGENT_ID}",
  "ok": true,
  "currentTask": "${CURRENT_TASK}"
}
EOF
)

auth_args=()
if [[ -n "${MC_AUTH_TOKEN:-}" ]]; then
  auth_args=(-H "Authorization: Bearer ${MC_AUTH_TOKEN}")
fi

curl -sf -X POST "${MC_URL}/api/agents/heartbeat" \
  -H "Content-Type: application/json" \
  "${auth_args[@]}" \
  -d "${payload}"

echo ""
echo "Heartbeat pushed for ${AGENT_ID}"
