#!/usr/bin/env bash
# Nightly canonical sweep — schedule at 3am CT via Railway cron or Barry.
#
# Usage:
#   MC_AUTH_TOKEN=... ./scripts/run-nightly-sweep.sh
#   MC_AUTH_TOKEN=... ./scripts/run-nightly-sweep.sh --force

set -euo pipefail

MC_URL="${MC_URL:-https://web-production-2c48a.up.railway.app}"
FORCE="${1:-}"

url="${MC_URL}/api/mission-control/sweep"
if [[ "${FORCE}" == "--force" ]]; then
  url="${url}?force=true"
fi

auth_args=()
if [[ -n "${MC_AUTH_TOKEN:-}" ]]; then
  auth_args=(-H "Authorization: Bearer ${MC_AUTH_TOKEN}")
fi

curl -sf -X POST "${url}" \
  -H "Content-Type: application/json" \
  "${auth_args[@]}"

echo ""
echo "Nightly sweep complete"
