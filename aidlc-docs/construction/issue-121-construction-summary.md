# Construction summary — Issue #121 (lightweight)

## Path taken
- Skipped formal per-unit FD/NFR/Infra approval gates (user agreed)
- Implemented U1–U3 in one pass

## U1 — Tickets machine allocate
- `infra/ticket-lambdas/cmd/allocate/main.go` — DynamoDB Next only; no secrets
- `infra/tickets.yml` + `tickets-secondary.yml` — `POST /allocate` with `AuthorizationType: AWS_IAM`
- Makefile + `tickets-deploy.yml` include `allocate` zip
- `make build` succeeds (auth, next, allocate)

## U2 — PR bot + IAM
- `.github/workflows/allocate-post-ids.yml` — PR + workflow_dispatch
- `scripts/ci/allocate-missing-post-ids.js` — SigV4 POST allocate, patch frontmatter
- `infra/github-actions-role.yml` — `GitHubActionsTicketsAllocate` execute-api:Invoke

## U3 — Docs + backfill
- `AGENTS.md`, `CLAUDE.md`, `aidlc-docs/workflow-conventions.md` updated
- Backfill of Photos without the deploy: run `allocate-post-ids.yml` workflow_dispatch after stacks + IAM policy are deployed (cannot mint id from this VM without AWS)

## Deploy order after merge
1. Redeploy `micahwalter-www-github-actions` (new managed policy)
2. Merge so `tickets-deploy.yml` builds allocate zip and updates both CFN stacks (template changed)
3. Spot-check: unsigned POST /allocate → 403; SigV4 with Actions role → `{ id }`
4. workflow_dispatch backfill for `content/posts/2026-07-20-photos-without-the-deploy/index.md`
5. Open a test PR with a draft post missing id to verify bot commit
