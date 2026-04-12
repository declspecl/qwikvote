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

The frontend (`qwikvote-website`) defaults to:
- dev: `http://localhost:8000`
- prod: `https://9zx14x4ipk.execute-api.us-east-1.amazonaws.com/v1`

You can override this at build time with `VITE_API_BASE_URL`:

```bash
cd qwikvote-website
cp .env.example .env.local
npm ci
npm run build
```

## GitHub Actions CI/CD

Two workflows are included:

- `CI`: validates the website build, API importability, and CDK synthesis.
- `Deploy`: on `main`, deploys the API stack first, rebuilds the website against the deployed API URL, then deploys the website stack.

Required GitHub repository configuration:

- Repository secret `AWS_DEPLOY_ROLE_ARN`
- Repository secret `RANDOM_ORG_API_KEY`

The deploy workflow uses GitHub OIDC via `aws-actions/configure-aws-credentials`, so `AWS_DEPLOY_ROLE_ARN` should trust GitHub Actions for this repository.

This repo includes a bootstrap CDK stack that creates that role for `declspecl/qwikvote` on the `main` branch:

```bash
cd qwikvote-cdk
cp .env.example .env.local
pnpm install --frozen-lockfile
pnpm exec cdk deploy qwikvote-github-actions
```

After that deploy finishes, copy the `GitHubActionsDeployRoleArn` stack output into the GitHub repository secret `AWS_DEPLOY_ROLE_ARN`.

Manual CDK deploys should build the website first, because the website stack publishes `qwikvote-website/dist`:

```bash
cd qwikvote-website
npm ci
VITE_API_BASE_URL="https://your-api-id.execute-api.us-east-1.amazonaws.com/v1" npm run build

cd ../qwikvote-cdk
cp .env.example .env.local
pnpm install --frozen-lockfile
pnpm exec cdk deploy qwikvote-alpha qwikvote-website-alpha
```
