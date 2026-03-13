# Qwikvote

CSI 4160 project group H

## Repository

The Python REST API is in [qwikvote-api](./qwikvote-api)

The React TypeScript frontend is in [qwikvote-website](./qwikvote-website)

## Local development

### DynamoDB Local (recommended for API dev)

This repo includes a `docker-compose.yml` that runs DynamoDB Local and creates the required table (`qwikvote-polls`) automatically.

Note: DynamoDB Local is configured to run **in-memory** in dev to avoid SQLite/volume permission issues. Data resets when the container is recreated.

Start DynamoDB Local:

```bash
docker compose up -d dynamodb-local dynamodb-local-init
```

### Run the API against DynamoDB Local

The API will use DynamoDB Local when `DYNAMODB_ENDPOINT_URL` is set.

```bash
cd qwikvote-api
export DYNAMODB_ENDPOINT_URL="http://localhost:8001"
export AWS_REGION="us-east-1"
./start.sh
```

### Quick API smoke test (curl)

Once the API is running locally (default `http://localhost:8000`), you can verify the full flow:

```bash
./scripts/test-local-api.sh
N=5 ./scripts/test-local-api-loop.sh
```

### Frontend API base URL

The frontend (`qwikvote-website`) hardcodes the API base URL:
- dev: `http://localhost:8000`
- prod: `https://9zx14x4ipk.execute-api.us-east-1.amazonaws.com/v1`
