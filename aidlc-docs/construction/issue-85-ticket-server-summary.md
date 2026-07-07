# Construction Summary — Issue #85: Ticket Server (Go)

**Branch**: `cursor/ticket-server-go-065a`  
**Date**: 2026-07-07

## Delivered

### Unit 1 — Go Lambdas (`infra/ticket-lambdas/`)
- `cmd/auth` — passcode → HMAC session token
- `cmd/next` — Bearer token → atomic DynamoDB increment
- `internal/sessiontoken`, `secrets`, `tickets`, `passcode`, `httpresp`
- Makefile with build/upload/deploy targets

### Unit 2 — Primary stack (`infra/tickets.yml`)
- DynamoDB `post_tickets` (us-east-1)
- Secrets Manager `ticket-server-secrets` with us-east-2 replica
- HTTP API at `api.micahwalter.com/tickets` (`POST /auth`, `POST /next`)
- CloudWatch error alarms

### Unit 3 — Secondary stack (`infra/tickets-secondary.yml`)
- Failover API in us-east-2
- Cross-region DynamoDB writes to primary table

### Unit 4 — CI/IAM
- `.github/workflows/tickets-deploy.yml`
- `GitHubActionsDeployTickets` managed policy in `github-actions-role.yml`

### Unit 5 — CLI
- `scripts/lib/allocate-post-id.js`, `tickets-credentials.js`
- Updated `create-post.js`, `import-photos.js`, `backfill-ids.js`

### Unit 6 — Photo upload
- `infra/photo-upload-lambdas/src/lib/tickets.js`
- `process.js` commits only `index.md`; uses ticket API
- `photo-upload-secrets` gains `ticketsPasscode`

### Unit 7 — Migration
- `scripts/seed-post-counter.js` (dry-run default, `--apply` + YES gate)
- Removed `content/post-counter`
- Updated `CLAUDE.md`, `AGENTS.md`

## Pre-deploy checklist

1. Deploy `micahwalter-tickets` (primary) and populate `ticket-server-secrets`
2. Run `node scripts/seed-post-counter.js` (review) then `--apply`
3. Deploy `micahwalter-tickets-secondary`
4. Redeploy `infra/github-actions-role.yml` (new managed policy)
5. Add `ticketsPasscode` to `photo-upload-secrets`; redeploy photo-upload stack
6. Smoke test: `blog post:new`, web upload, concurrent `/tickets/next`

## Validation

- [x] `make build` in `infra/ticket-lambdas`
- [x] `npm run build`

## Known limitation

If us-east-1 is unavailable, ticket allocation fails even when API serves from us-east-2 (counter table is primary-region only).
