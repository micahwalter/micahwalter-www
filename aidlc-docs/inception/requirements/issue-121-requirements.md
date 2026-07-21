# Requirements — Issue #121 Blog post ID allocation (Option 2 + 3)

## Intent Analysis

| Field | Value |
|-------|-------|
| **User request** | Implement Option 2 (machine-callable allocate on the tickets API) and Option 3 (PR workflow allocates and commits `id` before merge) so blog/email publishing does not need local `TICKETS_PASSCODE` |
| **Source** | [#121](https://github.com/micahwalter/micahwalter-www/issues/121); answers in `issue-121-requirement-verification-questions.md` |
| **Request type** | New feature (CI + tickets API) / enhancement of publishing workflow |
| **Scope** | Multiple components: `infra/ticket-lambdas` + `infra/tickets.yml`, GitHub Actions workflow(s), IAM (`github-actions-role.yml`), optional follow-up backfill commit for the live post |
| **Complexity** | Moderate |
| **Requirements depth** | Standard |

## Decisions from clarification

| Topic | Choice |
|-------|--------|
| Allocate trigger | When a PR **adds** `content/posts/**/index.md` missing `id` (early allocate; abandoned PRs may burn ids) |
| Apply method | Push a commit to the **PR branch** with `id: N` in frontmatter |
| Option 2 shape | **New authenticated route** on the existing tickets API; reads `ticket-server-secrets` server-side; returns `{ id }` without exposing passcode |
| Machine callers | **GitHub Actions only** (OIDC → IAM role) |
| Secret | `ticket-server-secrets` (`passcode` field) |
| Content types | **Blog and email** posts (not photos; photos already allocate in `photo-upload-process`) |
| Backfill | Yes — after machine path works, allocate and commit id for [Photos without the deploy](https://www.micahwalter.com/posts/photos-without-the-deploy) |
| Extensions | Security No · Resiliency No · PBT No |

## Functional Requirements

### FR-1 — Machine allocate route (Option 2)
1. Add a machine-oriented allocate endpoint on the existing tickets HTTP API (same custom domain mapping `api.micahwalter.com/tickets`).
2. The function authenticates the **caller** via IAM (API Gateway IAM authorization or equivalent SigV4), not via the human passcode body.
3. Internally the function loads `ticket-server-secrets` from Secrets Manager and advances the shared DynamoDB counter (same store as `/tickets/next`), then returns JSON `{ "id": <number> }`.
4. The passcode must never appear in GitHub Actions logs, workflow env dumps, or PR output.
5. Human/CLI path (`POST /tickets/auth` + `POST /tickets/next` with passcode) remains unchanged for local `blog post:new`.

### FR-2 — PR allocate workflow (Option 3)
1. On `pull_request` (opened/synchronize/reopened as needed), detect **newly added** files matching `content/posts/**/index.md` in the PR diff.
2. For each such file that is a **blog or email** post (not `type: photo`) and whose frontmatter lacks `id`, call the machine allocate route using the GitHub Actions OIDC role.
3. Commit and push to the **head branch** of the PR, adding `id: N` to frontmatter (one commit per run or batched; message should be clear, e.g. `chore: allocate post id N`).
4. Skip files that already have an `id`.
5. Do not allocate for photo posts (they use the photo-upload pipeline).
6. Idempotency: re-running the workflow on the same PR must not allocate a second id for a file that already received one in a prior push.

### FR-3 — IAM / deploy wiring
1. Extend the GitHub Actions IAM role (or a narrowly scoped policy) so the allocate workflow can invoke the machine tickets route (and only what is required for that call).
2. Redeploy guidance for `micahwalter-tickets` and `micahwalter-www-github-actions` must be documented in the PR / ops notes.

### FR-4 — Backfill published post
1. After the machine path works in CI (or via a one-shot workflow_dispatch that uses the same path), allocate an id for `content/posts/2026-07-20-photos-without-the-deploy/index.md` and land it on `main` (dedicated small PR or commit on this engagement's branch before merge).
2. Remove or replace the TODO comment in that file's frontmatter.

### FR-5 — Docs / conventions
1. Update `CLAUDE.md` / `AGENTS.md` (briefly) and/or `aidlc-docs/workflow-conventions.md` so agents know: write the post without a local passcode; the PR workflow will allocate `id` when the file is added.
2. Reference #121 from the implementation PR (`Closes #121` when acceptance criteria are met).

## Non-Functional Requirements

### NFR-1 — Security
- Machine route must not be anonymously callable.
- Prefer least-privilege IAM for the Actions role (invoke allocate only, not broad tickets admin).
- Do not store the ticket passcode in GitHub Actions secrets for this design (Secrets Manager stays canonical).

### NFR-2 — Reliability
- Allocation failure fails the workflow job with a clear error (do not merge silently without id if the job is required, or document if the check is advisory).
- Counter monotonicity and uniqueness must match existing `/tickets/next` behavior (same DynamoDB table).

### NFR-3 — Operability
- Workflow is observable in Actions logs without leaking secrets.
- Stack/template changes deploy via existing `tickets-deploy.yml` / IAM deploy patterns.

## Out of Scope
- Changing photo ID allocation
- Making `id` optional for blog posts long-term
- Cloud-agent direct AWS call path beyond what the GHA role already enables (Q4 = Actions only)
- Full resiliency / security baseline extensions (opted out)

## Success Criteria
- [ ] Opening a PR that adds a blog or email `index.md` without `id` results in a bot commit on that branch with `id: N`
- [ ] Re-running the workflow does not mint a second id for the same file
- [ ] Local `blog post:new` with passcode still works
- [ ] Machine route rejects unauthenticated callers
- [ ] Live post "Photos without the deploy" receives an `id` via the new path
- [ ] No local `TICKETS_PASSCODE` required for the PR-based publish path

## Extension Compliance Summary
| Extension | Status | Rationale |
|-----------|--------|-----------|
| Security Baseline | N/A (disabled) | User opted out |
| Resiliency Baseline | N/A (disabled) | User opted out |
| Property-Based Testing | N/A (disabled) | User opted out |
