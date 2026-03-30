#!/usr/bin/env bash

set -euo pipefail

if docker compose version >/dev/null 2>&1; then
  docker compose up -d dynamodb-local dynamodb-local-init
elif command -v docker-compose >/dev/null 2>&1; then
  docker-compose up -d dynamodb-local dynamodb-local-init
else
  echo "ERROR: docker compose (v2) or docker-compose (v1) is required." >&2
  exit 1
fi

export DYNAMODB_ENDPOINT_URL="http://localhost:8001"
export AWS_REGION="us-east-1"

./.venv/bin/uvicorn main:app --reload --host 0.0.0.0 --port 8000