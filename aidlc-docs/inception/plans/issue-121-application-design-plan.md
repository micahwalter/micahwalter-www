# Application Design Plan — Issue #121

Execute these steps after design questions below are answered. Checkboxes are updated as work completes.

## Design plan checklist

- [x] Resolve design clarification questions (below)
- [x] Generate `components.md` (component definitions and responsibilities)
- [x] Generate `component-methods.md` (method / interface signatures)
- [x] Generate `services.md` (orchestration: PR bot → machine allocate → DynamoDB)
- [x] Generate `component-dependency.md` (dependencies and data flow)
- [x] Generate consolidating `application-design.md`
- [x] Validate design completeness against FR-1..FR-5 in `issue-121-requirements.md`

---

## Design clarification questions

Please answer each `[Answer]:` below.

### Question 1
How should the new tickets machine allocate route be authorized at API Gateway?

A) HTTP API `AWS_IAM` authorization on the new route only (`POST /allocate` or similar); callers SigV4-sign with the GitHub Actions role. Existing `/auth` and `/next` stay JWT/passcode as today

B) Same as A, but also require an optional request body field (e.g. `reason` / `slug`) for audit logging only (still IAM-gated)

C) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 2
Where should machine allocate live in code?

A) New Lambda `tickets-allocate` (separate zip/handler) that increments DynamoDB directly using the existing tickets package — does **not** call `/auth`+`/next` over HTTP and does **not** need the passcode at runtime (only DynamoDB + optional audit). Closest to "IAM replaces passcode"

B) New Lambda that still loads `ticket-server-secrets` and reuses the same session/HMAC path internally (more like wrapping `/next`)

C) Extend the existing `tickets-next` function with a second code path when the request is IAM-authenticated vs Bearer token

D) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 3
Route path and HTTP method for machine allocate?

A) `POST /allocate` under the existing `api.micahwalter.com/tickets` mapping (full URL `https://api.micahwalter.com/tickets/allocate`)

B) `POST /next/machine` (nest under next)

C) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 4
Secondary region (`infra/tickets-secondary.yml`)?

A) Mirror the allocate route + Lambda in us-east-2 (same as auth/next failover), still writing the us-east-1 `post_tickets` table

B) Primary (us-east-1) only for this engagement; secondary later

C) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 5
PR bot commit behavior when multiple new blog/email posts without `id` appear in one PR?

A) One Actions run allocates sequentially and pushes a **single** commit updating all missing files

B) One commit per file (multiple pushes)

C) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 6
GitHub token / permissions for pushing to the PR head branch?

A) Use `GITHUB_TOKEN` with `contents: write` and `pull-requests: write` on the workflow (standard Actions push-to-PR-branch pattern; may need `persist-credentials` / checkout of head ref)

B) Use a fine-grained PAT / GitHub App stored in secrets (stronger for fork PRs; more setup)

C) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 7
Should the allocate workflow be a required status check on PRs that touch `content/posts/**`?

A) Yes — fail the check if allocation fails (blocks merge when required)

B) No — advisory only for this engagement; we can tighten later

C) Other (please describe after [Answer]: tag below)

[Answer]: B 
