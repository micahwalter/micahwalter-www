# Requirements — Issue #127 Exposure (periodic photo newsletter)

## Intent Analysis

| Field | Value |
|-------|-------|
| **User request** | Periodic single-photo email (Photosnack-inspired) via existing newsletter subscribers; mark photos eligible; track sent; automate with EventBridge; site archive as **Exposure** |
| **Source** | [#127](https://github.com/micahwalter/micahwalter-www/issues/127); `issue-127-open-questions.md`, `issue-127-decisions.md`, `issue-127-requirement-verification-questions.md` |
| **Request type** | New feature (photo + newsletter + site archive) |
| **Scope** | Multiple components: photo API/DB + edit UI, newsletter dispatch/EventBridge schedule, Exposure API + site routes, SES |
| **Complexity** | Moderate–complex |
| **Requirements depth** | Standard |

## Decisions summary

| Topic | Decision |
|-------|----------|
| Audience | Same long-form newsletter subscribers |
| Selection | Random among eligible + not-yet-sent |
| Site link | Photo/title → `/photos/{id}` |
| Series | **Exposure** — dedicated type + `/exposures` listing/detail |
| Archive storage | DynamoDB + API (like photos) |
| Brief text | Title + optional caption |
| Send path | **EventBridge only** (no CLI) |
| Schedule | Sunday **09:00 America/New_York** |
| Empty pool | No-op + SES notify to `AdminEmail` |
| Test send | Edit UI button → authenticated API → `AdminEmail`; does not blast or mark sent |
| Eligibility UI | Edit UI only (like `featured`) |
| Sent tracking | Fields on photo record |
| Subject | `Exposure #N · {title}` — **N** = dedicated Exposure counter |
| Owner email | Reuse newsletter **`AdminEmail`** / `ADMIN_EMAIL` |
| Extensions | Security No · Resiliency No · PBT No |

## Functional Requirements

### FR-1 — Eligibility
1. Photos gain an eligibility flag (e.g. `exposureEligible: boolean`), independent of homepage `featured`.
2. Owner can set/clear eligibility only via the `/upload` **edit** UI (and the authenticated photo patch API that UI already uses).
3. Upload form does **not** need an eligibility checkbox in v1.
4. Draft / non-public photos must not be selectable for send even if flagged eligible.

### FR-2 — Sent tracking on photo
1. When an Exposure is successfully dispatched to subscribers, stamp the photo (e.g. `exposureSentAt`, `exposureIssueNumber` and/or archive id).
2. Once stamped, the photo is excluded from future random selection.
3. Test sends must **not** stamp the photo or advance the Exposure issue counter.

### FR-3 — Exposure issue counter
1. Maintain a dedicated sequential counter for Exposure issue numbers (1, 2, 3…), independent of blog/photo/email ticket ids.
2. Allocate the next number only when a real (non-test) Exposure send proceeds.

### FR-4 — EventBridge scheduled send
1. EventBridge rule fires every **Sunday at 09:00 America/New_York**.
2. Handler selects **one** photo at random from the eligible + unsent + public pool.
3. Builds minimal HTML/text: image + title (+ caption if present); image and/or title link to `https://www.micahwalter.com/photos/{id}`.
4. Subject: `Exposure #N · {title}`.
5. Creates Exposure archive record (DynamoDB) and ensures public API can serve it.
6. Emits / invokes existing newsletter campaign dispatch path so all **ACTIVE** subscribers receive the email (reuse `newsletter_subscribers` + SES bulk path; per-subscriber idempotency via `newsletter_sends` with a campaign id tied to this Exposure issue).
7. On success, stamp the photo (FR-2) and persist archive metadata needed for `/exposures/[n]`.

### FR-5 — Empty pool
1. If no eligible unsent public photo exists when the schedule fires: **do not send**, do not advance the counter.
2. Notify the owner via SES to **`AdminEmail`** (same as newsletter subscriber-confirm admin mail).

### FR-6 — Owner test send
1. Edit UI includes a **Send test Exposure** (or equivalent) action for a selected photo.
2. Authenticated API sends a single test email to **`AdminEmail`** using the same body/subject shape as production (subject may indicate test).
3. Test must not email the subscriber list, must not write `newsletter_sends` for subscribers, must not stamp the photo, must not create a production archive issue (or if a draft/test artifact is created, it must not appear in the public `/exposures` listing).

### FR-7 — Exposure archive (site)
1. DynamoDB-backed Exposure records + HTTP API (pattern aligned with photos).
2. Site routes: listing `/exposures` and detail `/exposures/[n]` (issue number `n`).
3. Detail page shows the photo, title, optional caption, and link to `/photos/{id}`.
4. Listing shows Exposure issues newest-first (or reverse chronological by issue number).

### FR-8 — Newsletter integration
1. Reuse existing subscriber list and unsubscribe/footer behavior from newsletter dispatch where applicable.
2. No separate Exposure subscriber list in v1.
3. No owner CLI for send (`blog email:send` remains for long-form email posts only).

## Non-Functional Requirements

### NFR-1 — Security
- Eligibility, test send, and any write APIs remain behind the existing photo-upload auth (passcode session / same model as edit UI).
- Public Exposure read APIs are read-only and do not expose owner-only fields beyond what’s intended for the archive page.
- Test and empty-pool mail go only to `AdminEmail`.

### NFR-2 — Reliability
- Scheduled send should be idempotent for a given Sunday/issue attempt (no double-send to subscribers if the Lambda retries).
- Empty-pool path must be safe to re-run (notify at most once per scheduled invocation, or accept duplicate admin mail on rare retry — document chosen behavior in design).

### NFR-3 — Operability
- CloudWatch logs for schedule runs: selected photo id / empty pool / dispatch result.
- Document how to change `AdminEmail` (existing newsletter stack parameter) and the Sunday schedule.

### NFR-4 — Fit with static site
- Exposure pages follow the same client-or-build fetch approach used for API-backed photos (no requirement for a full static rebuild on each Sunday send).

## Out of scope (v1)

- Owner CLI for Exposure send
- Separate subscriber list
- Upload-time eligibility checkbox
- Hand-authored MDX email posts for Exposure
- Renaming or redesigning long-form `/emails`
- Security / Resiliency / PBT extension rule packs

## Acceptance criteria

- [ ] Photos can be marked `exposureEligible` from the edit UI
- [ ] Sunday 09:00 America/New_York EventBridge run sends at most one Exposure to all ACTIVE newsletter subscribers when inventory exists
- [ ] Selection is random among eligible, unsent, public photos
- [ ] Subject is `Exposure #N · {title}` with dedicated sequential N
- [ ] Photo is stamped after successful subscriber send; not after test
- [ ] Edit UI can send a test to `AdminEmail` without blasting subscribers
- [ ] Empty pool: no subscriber send; owner notified at `AdminEmail`
- [ ] `/exposures` and `/exposures/[n]` serve DynamoDB/API-backed archive
- [ ] Email body links to `/photos/{id}`
- [ ] Docs note schedule, AdminEmail, and eligibility/test UX

## Related artifacts

- `issue-127-decisions.md`
- `issue-127-open-questions.md`
- `issue-127-requirement-verification-questions.md`
- GitHub [#127](https://github.com/micahwalter/micahwalter-www/issues/127)
