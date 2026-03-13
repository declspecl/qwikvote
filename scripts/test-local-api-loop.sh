#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-http://localhost:8000}"
N="${N:-3}"

for i in $(seq 1 "$N"); do
  echo "=== Run $i/$N ==="
  API_BASE_URL="$API_BASE_URL" "$(dirname "$0")/test-local-api.sh" >/dev/null
done

echo "OK: ran ${N} times"

