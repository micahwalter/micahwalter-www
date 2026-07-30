# Issue #127 — Decisions

**Issue**: [#127 — Periodic photo newsletter (Photosnack-style)](https://github.com/micahwalter/micahwalter-www/issues/127)  
**Decided**: 2026-07-28  
**Source**: Interactive Q&A; answers also in `issue-127-open-questions.md`

## Decisions

| Topic | Choice | Decision |
|-------|--------|----------|
| Audience | A | Same subscriber list as the long-form newsletter |
| Selection | C | Random among eligible unsent photos |
| Site link | A | Photo and/or title links to `/photos/{id}` |
| Archive | B | Dedicated **Exposure** type + listing/detail routes (not Photosnack; not under `/emails`) |
| Empty pool (automation) | B / A | No-op when empty; **notify via SES** to configured owner address |
| Send trigger | — | **No CLI** — fully automated via **EventBridge** |
| Series name | B | **Exposure** — route TBD (`/exposures` or `/exposure`); content type e.g. `type: exposure` |
| Brief text | D | Title + caption when present; caption optional (title alone OK) |
| v1 scope | A | Full EventBridge loop in v1 (eligibility, tracking, schedule, email, Exposure archive, empty-pool notify) |
| Test send | A | Button in `/upload` edit UI → authenticated API → configured owner address; does not blast subscribers or mark photo as sent |
| Eligibility UI | A | Edit UI only (same pattern as `featured`) |
| Sent tracking | A | Fields on the photo record (`exposureSentAt` + optional campaign/archive id) |
| Subject line | B + # / A | `Exposure #N · {title}` where **N** is a dedicated sequential Exposure counter |
| Security Baseline | B | Skipped |
| Resiliency Baseline | B | Skipped |
| Property-Based Testing | C | Skipped |
| Schedule | A | Sunday **09:00 America/New_York** via EventBridge |
| Archive storage | A | DynamoDB + API (like photos); `/exposures` and `/exposures/[n]` |
| Owner email | A | Reuse newsletter **`AdminEmail`** / `ADMIN_EMAIL` (same as subscriber-confirm notify) |

## Additional constraints (2026-07-28)

| Topic | Decision |
|-------|----------|
| Send trigger | **No CLI** — fully automated via **EventBridge** (schedule → select photo → build/send → archive). Manual `blog email:send`-style flow is out of scope for this feature. |

## Implications for design

- Reuse `newsletter_subscribers` / existing SES dispatch path; no separate photo-only list in v1.
- Eligibility flag on photos is independent of homepage `featured`; selection draws randomly from eligible + not-yet-sent.
- Email body is one photo + brief text, with image/title linking to the site photo page.
- Each send creates an **Exposure** archive entry (own type + routes), not a long-form `/emails` post.
- **EventBridge schedule** drives the send (e.g. Sundays). If the eligible pool is empty, do not send; notify the owner.
- No owner CLI for selecting/sending; eligibility marking via UI/API still expected.


## Related artifacts

- Open questions (answered): `issue-127-open-questions.md`
- GitHub issue body open questions may remain unresolved on GitHub (token cannot edit issues); aidlc-docs is the source of truth for these decisions.
