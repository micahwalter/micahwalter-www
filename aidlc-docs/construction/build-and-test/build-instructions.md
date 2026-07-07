# Build Instructions — Issue #85 Ticket Server

## Prerequisites

- **Node.js** — matches repo `.nvmrc` / package.json
- **Go 1.25+** — see `infra/ticket-lambdas/go.mod`
- **zip** — for Lambda packaging (Makefile)
- **AWS CLI v2** — for deploy and seed script (profile `www`)

## Build Steps

### 1. Install Node dependencies

```bash
npm install
npm link   # optional: global `blog` CLI
```

### 2. Build Go ticket Lambdas

```bash
cd infra/ticket-lambdas
make build
```

**Expected artifacts:**
- `infra/ticket-lambdas/dist/auth.zip`
- `infra/ticket-lambdas/dist/next.zip`

### 3. Build static site

```bash
npm run build
```

**Expected:** Next.js static export to `/out` with no errors.

### 4. Upload Lambda zips (deploy prep)

```bash
cd infra/ticket-lambdas
make upload              # us-east-1
make upload-secondary    # us-east-2
```

Requires `aws sso login --profile www`.

### 5. Deploy CloudFormation stacks

```bash
# Primary (us-east-1)
make deploy

# Secondary (us-east-2) — after primary + secret populated
make deploy-secondary
```

Or merge to `main` and let `.github/workflows/tickets-deploy.yml` run (after IAM role stack updated).

## Environment Variables

| Variable | Used by | Default |
|----------|---------|---------|
| `TICKETS_API_URL` | CLI, photo-upload Lambda | `https://api.micahwalter.com/tickets` |
| `TICKETS_PASSCODE` | CLI | — (or credentials file) |
| `TICKETS_TABLE_NAME` | seed script | `post_tickets` |
| `TICKETS_DYNAMODB_REGION` | seed script | `us-east-1` |

## Troubleshooting

### Go build fails with missing module

```bash
cd infra/ticket-lambdas && go mod tidy && make build
```

### CloudFormation deploy fails on IAM role names

Stacks use fixed role names (`tickets-auth-fn-role`). Delete orphaned roles or use stack rollback before retry.

### `make upload` fails with AccessDenied

Redeploy `infra/github-actions-role.yml` locally with profile `www`, or verify SSO session: `aws sts get-caller-identity --profile www`.
