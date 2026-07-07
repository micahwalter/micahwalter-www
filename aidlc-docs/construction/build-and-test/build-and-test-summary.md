# Build and Test Summary — Issue #85 Ticket Server

**Date:** 2026-07-07  
**Branch:** `cursor/ticket-server-go-065a`  
**PR:** [#86](https://github.com/micahwalter/micahwalter-www/pull/86)

## Build Status

| Build | Command | Status |
|-------|---------|--------|
| Go Lambdas | `cd infra/ticket-lambdas && make build` | **Success** |
| Static site | `npm run build` | **Success** |

**Artifacts:**
- `infra/ticket-lambdas/dist/auth.zip`
- `infra/ticket-lambdas/dist/next.zip`
- `/out` static export

## Test Execution Summary

| Category | Status | Notes |
|----------|--------|-------|
| Unit tests | N/A | No automated tests added (opt-out) |
| Integration tests | **Pending deploy** | Manual curl/CLI scenarios documented |
| Performance tests | N/A | Low-traffic internal API |
| Security tests | N/A | Extension opted out |
| E2E tests | **Pending deploy** | Requires live API + secrets |

## Local verification completed

- [x] Go compiles for linux/arm64 (auth, next)
- [x] Site builds with post-counter removed
- [ ] Live API smoke test (requires AWS deploy)
- [ ] Seed script applied to DynamoDB
- [ ] Photo-upload end-to-end with `ticketsPasscode`

## Overall Status

- **Build:** Success
- **Automated tests:** N/A
- **Ready for AWS deploy:** Yes (code complete; infra not yet deployed)

## Deploy sequence (Operations)

1. Merge PR #86
2. Redeploy `micahwalter-www-github-actions` IAM stack
3. Deploy ticket primary + populate `ticket-server-secrets`
4. `node scripts/seed-post-counter.js --apply`
5. Deploy ticket secondary
6. Update `photo-upload-secrets`; redeploy photo-upload
7. Run integration test scenarios in `integration-test-instructions.md`

## Instruction files

- `build-instructions.md`
- `unit-test-instructions.md`
- `integration-test-instructions.md`

## Known limitation

Ticket allocation requires us-east-1 DynamoDB availability even when API fails over to us-east-2.
