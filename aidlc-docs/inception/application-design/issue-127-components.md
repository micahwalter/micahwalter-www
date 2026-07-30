# Components — Issue #127 Exposure

High-level components for the Exposure periodic photo newsletter. Detailed business rules are deferred to Functional Design (per unit).

## C1 — Photo Metadata Store

| | |
|--|--|
| **Purpose** | Persist photo records including Exposure eligibility and sent stamps |
| **Stack** | Photo-upload (DynamoDB photos table) |
| **Responsibilities** | Store/update `exposureEligible`, `exposureSentAt`, `exposureIssueNumber`; query eligible+unsent+public pool; support existing photo CRUD |

## C2 — Photo Owner API

| | |
|--|--|
| **Purpose** | Authenticated owner operations on photos (edit + test send) |
| **Stack** | Photo-upload HTTP API (`api.micahwalter.com/photos`) |
| **Responsibilities** | PATCH photo including `exposureEligible`; `POST …/exposures/test` (or equivalent) to send test email to `AdminEmail` without stamping or blasting subscribers |

## C3 — Photo Edit UI

| | |
|--|--|
| **Purpose** | Owner UX to mark eligibility and send a test Exposure |
| **Location** | `app/upload/PhotoEditPanel.tsx` (and related) |
| **Responsibilities** | Checkbox for eligibility; “Send test Exposure” action; display sent/issue state when present |

## C4 — Exposure Archive Store

| | |
|--|--|
| **Purpose** | Persist published Exposure issues for the public archive |
| **Stack** | Photo-upload DynamoDB (exposures table) |
| **Responsibilities** | Create Exposure record on successful production send; list/get by issue number `n` |

## C5 — Exposure Counter

| | |
|--|--|
| **Purpose** | Dedicated sequential issue numbers (`#1`, `#2`, …) |
| **Stack** | Photo-upload DynamoDB counter item/table |
| **Responsibilities** | Atomically allocate next `N` for production sends only (not tests) |

## C6 — Exposure Public API

| | |
|--|--|
| **Purpose** | Public read API for archive pages |
| **Base URL** | `https://api.micahwalter.com/exposures` |
| **Responsibilities** | `GET /` list; `GET /{n}` detail; CORS for site |

## C7 — Exposure Site UI

| | |
|--|--|
| **Purpose** | Public archive browsing |
| **Routes** | `/exposures`, `/exposures/[n]` |
| **Responsibilities** | Fetch from Exposure Public API; show photo, title, optional caption, link to `/photos/{id}` |

## C8 — Exposure Send Orchestrator

| | |
|--|--|
| **Purpose** | Sunday schedule: select photo, build email, create archive, dispatch, stamp |
| **Stack** | New Lambda in **photo-upload** package; EventBridge rule Sun 09:00 America/New_York |
| **Responsibilities** | Empty-pool → SES notify `AdminEmail`; else allocate `N`, build HTML/text, write Exposure, emit `NewsletterSendRequested`, stamp photo on success path coordination |

## C9 — Newsletter Dispatch (existing)

| | |
|--|--|
| **Purpose** | Deliver campaign HTML to ACTIVE subscribers |
| **Stack** | Newsletter (`newsletter-bus` → dispatch Lambda → SES) |
| **Responsibilities** | Unchanged contract: consume `NewsletterSendRequested` with `emailId`, bodies, `viewInBrowserUrl`, optional `testEmail`; subscriber idempotency via `newsletter_sends` |

## C10 — Admin Notify (existing pattern)

| | |
|--|--|
| **Purpose** | Owner email for tests and empty-pool |
| **Config** | Newsletter CFN `AdminEmail` → `ADMIN_EMAIL` (orchestrator/test path must read same value or a mirrored env/param in photo stack wired to the same address) |
| **Responsibilities** | Destination for test Exposure and empty-pool SES messages |
