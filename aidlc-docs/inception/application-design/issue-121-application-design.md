# Application Design — Issue #121 (consolidated)

## Summary

Add an IAM-authenticated `POST /tickets/allocate` Lambda that advances the same DynamoDB counter as `/tickets/next`, without using the human passcode. Wire a GitHub Actions PR workflow that detects new blog/email posts missing `id`, calls allocate via OIDC SigV4, and pushes a single commit onto the PR branch. Mirror allocate in us-east-2. Keep the check advisory. Backfill the live Photos without the deploy post once the path works.

## Design decisions (locked)

| Topic | Decision |
|-------|----------|
| Auth | API Gateway `AWS_IAM` on allocate only |
| Implementation | New `tickets-allocate` Lambda; DynamoDB direct; no secret load |
| Path | `POST /allocate` → `https://api.micahwalter.com/tickets/allocate` |
| Secondary | Mirror in `tickets-secondary.yml` |
| Multi-file | One commit per workflow run |
| Push creds | `GITHUB_TOKEN` with contents write |
| Required check | Advisory for this engagement |

## Artifact index

- [issue-121-components.md](./issue-121-components.md)
- [issue-121-component-methods.md](./issue-121-component-methods.md)
- [issue-121-services.md](./issue-121-services.md)
- [issue-121-component-dependency.md](./issue-121-component-dependency.md)

## Traceability to requirements

| FR | Design coverage |
|----|-----------------|
| FR-1 Machine allocate | TicketsAllocateFn + IAM route |
| FR-2 PR workflow | PostIdAllocateWorkflow + FrontmatterPostIdPatcher |
| FR-3 IAM wiring | GitHubActions role execute-api:Invoke |
| FR-4 Backfill | Same allocate path; content commit |
| FR-5 Docs | Conventions update in U3 |

## Out of scope (unchanged)
- Photo allocate path
- Changing `/auth` or `/next`
- Making branch protection require the new check (later)
