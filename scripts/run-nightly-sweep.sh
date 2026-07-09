#!/usr/bin/env bash
# Nightly canonical sweep — schedule at 3am CT via Railway cron or Barry.
#
# Usage:
#   MC_AUTH_TOKEN=... ./scripts/run-nightly-sweep.sh
#   MC_AUTH_TOKEN=... ./scripts/run-nightly-sweep.sh --force

set -euo pipefail

MC_URL="${MC_URL:-https://web-production-2c48a.up.railway.app}"
FORCE="${1:-}"

if [[ -z "${MC_AUTH_TOKEN:-}" ]]; then
  echo "MC_AUTH_TOKEN is required; refusing to run an unauthenticated sweep." >&2
  exit 1
fi

url="${MC_URL}/api/mission-control/sweep"
if [[ "${FORCE}" == "--force" ]]; then
  url="${url}?force=true"
fi

curl -sf -X POST "${url}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${MC_AUTH_TOKEN}"

echo ""
echo "Nightly sweep complete"
