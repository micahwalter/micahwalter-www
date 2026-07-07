# Requirements — Issue #85: Serverless Ticket Server (Go)

## Intent Analysis

| Field | Value |
|-------|-------|
| **User request** | Replace git-based `content/post-counter` with a serverless ticket server API; Go Lambdas; separate auth; single counter for blog posts and photo posts; multi-region compatible |
| **Request type** | New feature + migration |
| **Scope** | Multiple components — new infra stack, Go Lambdas, CLI integration, photo-upload integration, seed/migration, remove git counter |
| **Complexity** | Moderate — well-understood atomic counter pattern; multi-region adds coordination constraints |
| **GitHub issue** | [#85](https://github.com/micahwalter/micahwalter-www/issues/85) |
| **Prior art** | [micahwalter/tickets](https://github.com/micahwalter/tickets) |
| **Branch** | `cursor/ticket-server-go-065a` |

### Problem statement

All post types (blog, photo, email) share a sequential integer `id` allocated from `content/post-counter`. Four writers (CLI create-post, CLI import-photos, photo-upload Lambda, backfill script) coordinate via a git file, causing race conditions and extra commits. The counter must become a centralized, atomic service.

### Confirmed decisions (from Q&A + follow-up)

| Decision | Choice |
|----------|--------|
| Language | Go (`infra/ticket-lambdas/`, newsletter patterns) |
| Auth | Separate `ticket-server-secrets` (`passcode`, `hmac`) — not shared with photo-upload |
| Stack | New `infra/tickets.yml` + secondary stack + CI workflow |
| Scope | End-to-end — infra, CLI, photo-upload, remove git counter |
| CLI auth | Interactive passcode prompt on first use; cache HMAC token for TTL; persist passcode in credentials file |
| Photo-upload access | HTTP — `POST /tickets/auth` then `POST /tickets/next` (not direct DynamoDB) |
| Seed | Script computes value; **manual review required** before first production allocation |
| Counter scope | **Single ticket server** — one counter for blog posts, photo posts, and email posts |
| Multi-region | Must work with existing active-passive API failover (us-east-1 primary, us-east-2 secondary) |
| User Stories | Skipped |
| Extensions | Security, Resiliency, PBT — all disabled |

---

## Functional Requirements

### FR-1: Ticket Server API

| ID | Requirement |
|----|-------------|
| FR-1.1 | Expose HTTP API at `https://api.micahwalter.com/tickets/*` via `ApiMappingKey: tickets` |
| FR-1.2 | `POST /tickets/auth` — accept `{ "passcode": "..." }`, return `{ "token", "expiresIn" }` (HMAC-signed, stateless, TTL default 30 min) |
| FR-1.3 | `POST /tickets/next` — require `Authorization: Bearer <token>`, atomically increment counter, return `{ "id": <int> }` |
| FR-1.4 | Invalid/missing passcode → 401; invalid/expired token → 401; malformed body → 400 |
| FR-1.5 | Throttle `/auth` route harder than `/next` (mirror photo-upload API Gateway settings) |
| FR-1.6 | CORS: allow `https://www.micahwalter.com` and `http://localhost:3000` (for future browser use; CLI uses direct HTTP) |

### FR-2: Single global counter

| ID | Requirement |
|----|-------------|
| FR-2.1 | One DynamoDB item holds the counter — partition key e.g. `"post-ids"` |
| FR-2.2 | **Same counter** serves blog posts (`blog post:new`), photo posts (`photos:import`, web upload), and email posts |
| FR-2.3 | Allocated IDs are monotonically increasing integers; gaps acceptable on failed post creation |
| FR-2.4 | Counter continues from seeded high-water mark (currently 147); existing post IDs unchanged |

### FR-3: CLI integration

| ID | Requirement |
|----|-------------|
| FR-3.1 | Shared helper `scripts/lib/allocate-post-id.js` calls ticket API |
| FR-3.2 | On first use: prompt for passcode interactively; store in `~/.config/blog/credentials` (JSON) |
| FR-3.3 | Cache session token in memory for process lifetime; refresh when expired |
| FR-3.4 | Env var `TICKETS_PASSCODE` overrides credentials file (for CI/automation) |
| FR-3.5 | Update `scripts/create-post.js` and `scripts/import-photos.js` to use allocate helper |
| FR-3.6 | Update `scripts/backfill-ids.js` to sync counter via seed/admin path after backfill |

### FR-4: Photo-upload integration

| ID | Requirement |
|----|-------------|
| FR-4.1 | Photo-upload process Lambda calls ticket API over HTTPS (not direct DynamoDB) |
| FR-4.2 | Store ticket passcode (or pre-shared service credential) in `photo-upload-secrets` for Lambda auth |
| FR-4.3 | Flow: auth → next → assign `id` → commit **only** `content/posts/{folder}/index.md` (drop `content/post-counter` from GitHub commit) |
| FR-4.4 | Use `https://api.micahwalter.com/tickets` (Route53 failover-aware URL) |

### FR-5: Migration and deprecation

| ID | Requirement |
|----|-------------|
| FR-5.1 | Seed script: `scripts/seed-post-counter.js` — compute `max(content/post-counter, max frontmatter id)` |
| FR-5.2 | Seed writes to DynamoDB only after operator review/confirmation (dry-run default) |
| FR-5.3 | Remove `content/post-counter` from repo after cutover |
| FR-5.4 | Update `CLAUDE.md`, `README.md`, `AGENTS.md` |

### FR-6: Deployment and CI

| ID | Requirement |
|----|-------------|
| FR-6.1 | Primary stack `infra/tickets.yml` (us-east-1) |
| FR-6.2 | Secondary stack `infra/tickets-secondary.yml` (us-east-2) — mirror newsletter-secondary pattern |
| FR-6.3 | Go Makefile: build arm64, zip, upload artifacts, deploy/update-functions |
| FR-6.4 | GitHub Actions workflow `.github/workflows/tickets-deploy.yml` — auto-deploy on push to `main` |
| FR-6.5 | Extend `infra/github-actions-role.yml` with ticket stack deploy permissions |

---

## Non-Functional Requirements

### NFR-1: Multi-region design

| ID | Requirement |
|----|-------------|
| NFR-1.1 | Deploy ticket API (auth + next Lambdas, API Gateway, ApiMapping) in **both** us-east-1 and us-east-2 |
| NFR-1.2 | Route53 failover on `api.micahwalter.com` routes `/tickets/*` to healthy region (existing api-domain stacks) |
| NFR-1.3 | **Counter table is primary-region only (us-east-1)** — NOT a DynamoDB Global Table. Sequential IDs require a single writer region to prevent duplicate IDs during dual-region writes |
| NFR-1.4 | Lambdas in **both** regions perform DynamoDB `UpdateItem` against the **us-east-1** table (cross-region SDK endpoint) |
| NFR-1.5 | Replicate `ticket-server-secrets` to us-east-2 via Secrets Manager `ReplicaRegions` (mirror `newsletter-hmac-key` pattern) so secondary Lambdas resolve local secret replica for HMAC verify/sign |
| NFR-1.6 | **Failover limitation (documented):** if us-east-1 is unavailable, ticket allocation fails even when API serves from us-east-2 — acceptable; publishing also degrades |
| NFR-1.7 | Bootstrap secondary artifacts bucket (or reuse newsletter artifacts bucket with separate prefix) |

### NFR-2: Security

| ID | Requirement |
|----|-------------|
| NFR-2.1 | Constant-time passcode comparison; 1s delay on auth failure |
| NFR-2.2 | HMAC-SHA256 tokens with embedded expiry (reuse newsletter `internal/token` pattern) |
| NFR-2.3 | Secrets in Secrets Manager only; never in git |
| NFR-2.4 | API Gateway throttling on auth route |

### NFR-3: Reliability and observability

| ID | Requirement |
|----|-------------|
| NFR-3.1 | Structured logging (slog) in Go Lambdas |
| NFR-3.2 | CloudWatch alarms on Lambda errors (primary + secondary) |
| NFR-3.3 | Idempotent seed script (safe to re-run) |

### NFR-4: Consistency with codebase

| ID | Requirement |
|----|-------------|
| NFR-4.1 | Go module layout mirrors `infra/newsletter-lambdas/` (`cmd/`, `internal/`) |
| NFR-4.2 | Lambda runtime: provided.al2023 arm64, `GOOS=linux GOARCH=arm64`, `-tags lambda.norpc` |
| NFR-4.3 | CloudFormation (not CDK) — consistent with existing infra |

---

## Architecture summary

```
                    Route53 failover
                    api.micahwalter.com
                           |
            +--------------+--------------+
            |                             |
      us-east-1 API                 us-east-2 API
      /tickets/auth                 /tickets/auth
      /tickets/next                 /tickets/next
            |                             |
            +--------------+--------------+
                           |
                  cross-region write
                           v
              DynamoDB post_tickets (us-east-1 ONLY)
              pk: "post-ids"  value: 147
                           ^
                           |
        +------------------+------------------+
        |                                     |
   blog CLI                           photo-upload Lambda
   (HTTPS + user passcode)            (HTTPS + secret passcode)
```

### Consumers (all share one counter)

| Consumer | Access method | Post types |
|----------|---------------|------------|
| `blog post:new` | HTTPS + interactive passcode | Blog |
| `blog photos:import` | HTTPS + interactive passcode | Photo |
| Photo-upload Lambda | HTTPS + secret passcode | Photo |
| Future email post tooling | HTTPS + passcode | Email |

---

## Out of scope

- Rewriting photo-upload Lambdas in Go (remain Node.js; HTTP client only)
- DynamoDB Global Table for counter (incorrect for sequential IDs)
- Public/anonymous ticket endpoint (original tickets repo pattern)
- Browser-facing ticket UI

---

## Success criteria

- [ ] `POST /tickets/auth` and `POST /tickets/next` work on `api.micahwalter.com/tickets` in both regions
- [ ] Concurrent allocations never return duplicate IDs
- [ ] CLI and photo-upload allocate from same counter
- [ ] Photo-upload commits exclude `content/post-counter`
- [ ] `content/post-counter` removed from repo
- [ ] Seed script with manual review gate executed before production cutover
- [ ] Secondary stack deployed; failover smoke test passes
- [ ] `npm run build` succeeds; Go Lambda build succeeds

---

## Traceability

| Source | Decisions captured |
|--------|-------------------|
| `issue-85-requirement-verification-questions.md` | Scope, auth, CLI, photo-upload HTTP, seed, stack, extensions, stories |
| User follow-up (2026-07-07) | Single counter for posts + photos; multi-region |
| `#84`, `#85` | Problem context, ticket server concept |
| `micahwalter/tickets` | DynamoDB atomic increment |
| `infra/newsletter*.yml` | Multi-region API, secrets replica, secondary stack pattern |
