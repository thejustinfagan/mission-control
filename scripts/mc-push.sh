#!/usr/bin/env bash
# mc-push.sh — push an activity to Mission Control's durable feed.
#
# Usage:
#   scripts/mc-push.sh <project> <actionType> <description> [status]
#
# Examples:
#   scripts/mc-push.sh battle-dinghy deploy "Deployed v1.4 to Railway" success
#   scripts/mc-push.sh fleet-intel work "Refactored ingest pipeline" in_progress
#
# Env:
#   MC_URL    Mission Control base URL
#             (default: https://web-production-2c48a.up.railway.app)
#   MC_ACTOR  Who is pushing (default: $USER or "mc-push")
#
# The update is stored in Postgres and appears in the Mission Control proof feed.
# It is recorded as testimony — it does NOT mark a project "verified healthy"; that
# still requires a live probe/render.

set -euo pipefail

MC_URL="${MC_URL:-https://web-production-2c48a.up.railway.app}"
MC_ACTOR="${MC_ACTOR:-${USER:-mc-push}}"

if [ "$#" -lt 3 ]; then
  echo "usage: $0 <project> <actionType> <description> [status]" >&2
  exit 2
fi

PROJECT="$1"
ACTION_TYPE="$2"
DESCRIPTION="$3"
STATUS="${4:-success}"

payload=$(cat <<JSON
{"project":"${PROJECT}","actionType":"${ACTION_TYPE}","description":"${DESCRIPTION}","status":"${STATUS}","actor":"${MC_ACTOR}"}
JSON
)

echo "→ POST ${MC_URL}/api/activities"
http_code=$(curl -sS -o /tmp/mc-push-resp.json -w "%{http_code}" \
  -X POST "${MC_URL}/api/activities" \
  -H "Content-Type: application/json" \
  -d "${payload}")

echo "← HTTP ${http_code}"
cat /tmp/mc-push-resp.json 2>/dev/null && echo

if [ "${http_code}" = "201" ]; then
  echo "✓ activity recorded"
else
  echo "✗ not recorded (see response above). If 503: DATABASE_URL is not set on the deploy." >&2
  exit 1
fi
