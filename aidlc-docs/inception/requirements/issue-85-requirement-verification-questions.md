# Issue #85 — Ticket Server Requirements Clarification

Please answer the following questions. Fill in each `[Answer]:` tag directly in this file.

**Context already confirmed from conversation:**
- Go for all new infra Lambdas (match newsletter stack patterns)
- Separate auth secrets from photo-upload (`ticket-server-secrets`, distinct passcode)
- Serverless ticket server on `api.micahwalter.com/tickets`
- Prior art: https://github.com/micahwalter/tickets
- GitHub issue: https://github.com/micahwalter/micahwalter-www/issues/85
- Branch: `cursor/ticket-server-go-065a`

---

## Question 1 — Phase 1 scope

What should the first deliverable include?

A) **Infra only** — Go Lambdas, DynamoDB table, CloudFormation stack, CI deploy workflow, seed script. CLI and photo-upload integration in a follow-up PR.

B) **Full migration** — Everything in A, plus update `scripts/create-post.js`, `scripts/import-photos.js`, photo-upload `process.js`, and remove `content/post-counter` from git in the same effort.

C) **Infra + photo-upload** — Go ticket server plus photo-upload Lambda switch to DynamoDB (direct IAM), but defer CLI changes.

D) **Infra + CLI** — Go ticket server plus CLI integration, but leave photo-upload on git counter until a follow-up.

X) Other (please describe after [Answer]: tag below)

[Answer]:

---

## Question 2 — Implementation language (confirmed)

All new ticket-server Lambdas will be written in Go, following `infra/newsletter-lambdas/` conventions (Makefile, arm64, `lambda.norpc`).

A) Confirmed — Go only for ticket server Lambdas

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 3 — Authentication separation (confirmed)

Ticket server uses its own Secrets Manager secret and passcode, independent of `photo-upload-secrets`.

A) Confirmed — separate `ticket-server-secrets` with `{ "passcode", "hmac" }`

B) Shared HMAC key, separate passcode only

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 4 — CLI credential storage

How should the `blog` CLI authenticate to `POST /tickets/auth`?

A) Environment variable only (`TICKETS_PASSCODE`)

B) Env var with fallback to `~/.config/blog/credentials` (JSON with `ticketsPasscode`)

C) Prompt interactively on first use, cache token for TTL (passcode stored in credentials file)

D) No CLI changes in phase 1 — manual `curl` / AWS-only for now

X) Other (please describe after [Answer]: tag below)

[Answer]:

---

## Question 5 — Photo-upload internal access

How should the photo-upload process Lambda allocate IDs once the ticket server exists?

A) **Direct DynamoDB** via IAM role on the shared `post_tickets` table (no HTTP hop; recommended)

B) Call `POST /tickets/next` over HTTP with a service token

C) Defer photo-upload changes — not in scope for this work

X) Other (please describe after [Answer]: tag below)

[Answer]:

---

## Question 6 — Counter seed value

What should the initial DynamoDB counter be seeded to?

A) Current file value (`content/post-counter`, currently 147) — next allocation returns 148

B) `max(147, max id across all post frontmatter)` — safer if file and posts ever drifted

C) Run seed script but require manual review before first production allocation

X) Other (please describe after [Answer]: tag below)

[Answer]:

---

## Question 7 — Stack placement

Where should ticket server infrastructure live?

A) **New stack** — `infra/tickets.yml` + `infra/ticket-lambdas/` + `.github/workflows/tickets-deploy.yml` (recommended)

B) Extend `infra/photo-upload.yml` (fewer stacks, mixed concerns)

C) Extend `infra/newsletter.yml` (reuse artifacts bucket)

X) Other (please describe after [Answer]: tag below)

[Answer]:

---

## Question 8 — Security Extensions

Should security extension rules be enforced for this project?

A) Yes — enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)

B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)

X) Other (please describe after [Answer]: tag below)

[Answer]:

---

## Question 9 — Resiliency Extensions

Should the resiliency baseline be applied to this project?

A) Yes — apply the resiliency baseline as directional best practices and design-time guidance

B) No — skip the resiliency baseline (suitable for PoCs and low-traffic internal APIs)

X) Other (please describe after [Answer]: tag below)

[Answer]:

---

## Question 10 — Property-Based Testing Extension

Should property-based testing (PBT) rules be enforced for this project?

A) Yes — enforce all PBT rules as blocking constraints

B) Partial — enforce PBT only for pure functions and serialization round-trips (token verify, DynamoDB helpers)

C) No — skip all PBT rules

X) Other (please describe after [Answer]: tag below)

[Answer]:

---

## Question 11 — User Stories stage

Should we include a formal User Stories stage for this feature?

A) Skip — requirements + workflow plan are sufficient (single-author internal tooling)

B) Include — lightweight user stories for CLI author and photo-upload flows

X) Other (please describe after [Answer]: tag below)

[Answer]:
