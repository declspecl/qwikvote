#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-http://localhost:8000}"

CURL_CONNECT_TIMEOUT="${CURL_CONNECT_TIMEOUT:-2}"
CURL_MAX_TIME="${CURL_MAX_TIME:-15}"

print_json_or_raw() {
  local body="$1"
  if echo "$body" | jq . >/dev/null 2>&1; then
    echo "$body" | jq .
  else
    echo "Non-JSON response:" >&2
    echo "$body" >&2
    return 1
  fi
}

curl_json() {
  # Prints response body to stdout. Emits basic timing + status to stderr.
  local method="$1"
  local url="$2"
  local data="${3:-}"

  local tmp
  tmp="$(mktemp)"
  if [[ -n "$data" ]]; then
    curl -sS -X "$method" "$url" \
      --connect-timeout "$CURL_CONNECT_TIMEOUT" \
      --max-time "$CURL_MAX_TIME" \
      -H "Content-Type: application/json" \
      -w "\n[curl] status=%{http_code} time_total=%{time_total}s\n" \
      -o "$tmp" \
      -d "$data" \
      1>/dev/null
  else
    curl -sS -X "$method" "$url" \
      --connect-timeout "$CURL_CONNECT_TIMEOUT" \
      --max-time "$CURL_MAX_TIME" \
      -w "\n[curl] status=%{http_code} time_total=%{time_total}s\n" \
      -o "$tmp" \
      1>/dev/null
  fi

  cat "$tmp"
  rm -f "$tmp"
}

echo "== Health =="
HEALTH_RES="$(curl_json GET "${API_BASE_URL}/health")"
print_json_or_raw "$HEALTH_RES"

echo
echo "== Create poll =="
CREATE_RES="$(curl_json POST "${API_BASE_URL}/polls" '{
  "title": "Curl test poll",
  "description": "Created from bash script",
  "options": [
    "Option A",
    "Option B"
  ],
  "config": { "veto_enabled": false, "weighted_voting": false, "llm_suggestions_enabled": false },
  "password": null
}')"
print_json_or_raw "$CREATE_RES"

POLL_ID="$(echo "$CREATE_RES" | jq -r '.poll_id')"
if [[ -z "$POLL_ID" || "$POLL_ID" == "null" ]]; then
  echo "ERROR: poll_id missing from response" >&2
  exit 1
fi
echo "poll_id=${POLL_ID}"

echo
echo "== Get poll =="
GET_RES="$(curl -sS "${API_BASE_URL}/polls/${POLL_ID}")"
print_json_or_raw "$GET_RES"

OPTION_ID="$(echo "$GET_RES" | jq -r '.options[0].option_id')"
if [[ -z "$OPTION_ID" || "$OPTION_ID" == "null" ]]; then
  echo "ERROR: option_id missing from poll response" >&2
  exit 1
fi
echo "option_id=${OPTION_ID}"

echo
echo "== Submit vote =="
curl -sS -X POST "${API_BASE_URL}/polls/${POLL_ID}/vote" \
  -H "Content-Type: application/json" \
  -d "{ \"option_id\": \"${OPTION_ID}\", \"weight\": 1, \"is_veto\": false }" | jq .

echo
echo "== Close poll =="
curl -sS -X POST "${API_BASE_URL}/polls/${POLL_ID}/close" \
  -H "Content-Type: application/json" \
  -d '{ "password": null }' | jq .

echo
echo "== Get poll after close =="
FINAL_RES="$(curl -sS "${API_BASE_URL}/polls/${POLL_ID}")"
print_json_or_raw "$FINAL_RES"

