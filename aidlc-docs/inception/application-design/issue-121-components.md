# Components — Issue #121

## TicketsAllocateFn (`tickets-allocate`)

**Purpose**: Machine-only post ID allocation for CI.

**Responsibilities**:
- Accept `POST /allocate` when API Gateway has already authorized the caller with `AWS_IAM`
- Atomically increment the shared `post_tickets` DynamoDB counter (same as `tickets-next`)
- Return `{ "id": <number> }`
- Log allocate success/failure without secrets
- Do **not** load or use `ticket-server-secrets` / passcode / HMAC

**Interfaces**:
- Inbound: API Gateway HTTP API proxy (IAM-authorized route)
- Outbound: DynamoDB `UpdateItem` on `post_tickets` (primary table in us-east-1; secondary Lambda uses cross-region client)

## TicketsApi (extended)

**Purpose**: Existing HTTP API at `api.micahwalter.com/tickets`.

**New responsibility**:
- Expose `POST /allocate` with `AuthorizationType: AWS_IAM`
- Keep `POST /auth` and `POST /next` unchanged (passcode / Bearer)

## PostIdAllocateWorkflow (GitHub Actions)

**Purpose**: Option 3 PR bot.

**Responsibilities**:
- On `pull_request` for same-repo PRs, detect newly added `content/posts/**/index.md`
- Filter to blog/email posts missing frontmatter `id` (skip `type: photo`)
- Assume AWS via OIDC; SigV4-call `POST .../tickets/allocate` per missing file
- Write `id: N` into frontmatter; push **one** commit to the PR head branch
- Fail the job on allocate/push errors (advisory check; not required for merge in this engagement)

## GitHubActionsDeployRole (extended)

**Purpose**: Existing OIDC role used by CI.

**New responsibility**:
- Allow `execute-api:Invoke` on the tickets allocate route (primary, and secondary if used)
- No need for `secretsmanager:GetSecretValue` on `ticket-server-secrets` for this path

## FrontmatterPostIdPatcher (script used by workflow)

**Purpose**: Pure helper (Node) for detect + patch.

**Responsibilities**:
- Parse gray-matter / YAML frontmatter
- Decide if a path needs allocation (blog/email, missing id)
- Insert `id: N` into frontmatter idempotently
