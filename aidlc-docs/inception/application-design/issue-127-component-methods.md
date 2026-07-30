# Component Methods — Issue #127 Exposure

Method-level interfaces only. Business rules refined in Construction Functional Design.

## C1 — Photo Metadata Store

| Method | Input | Output | Purpose |
|--------|-------|--------|---------|
| `updateExposureFields(id, patch)` | photo id; `{ exposureEligible?, exposureSentAt?, exposureIssueNumber? }` | updated photo | Owner eligibility + post-send stamp |
| `listExposureCandidates()` | — | photos[] | Public, eligible, not yet sent |
| `getPhoto(id)` | id | photo \| null | Existing |

## C2 — Photo Owner API

| Method | HTTP | Input | Output | Purpose |
|--------|------|-------|--------|---------|
| `patchPhoto` | `PATCH /photos/{id}` | auth + body incl. `exposureEligible` | photo | Set/clear eligibility |
| `sendExposureTest` | `POST /photos/{id}/exposure-test` (name TBD) | auth | `{ ok: true }` | Build test body; SES/`NewsletterSendRequested` with `testEmail=AdminEmail`; no stamp, no archive issue |

## C3 — Photo Edit UI

| Method | Purpose |
|--------|---------|
| `toggleExposureEligible()` | Bind checkbox → patch API |
| `sendTestExposure()` | Call test endpoint; show success/error |

## C4 — Exposure Archive Store

| Method | Input | Output | Purpose |
|--------|-------|--------|---------|
| `createExposure(record)` | `{ issueNumber, photoId, title, caption?, sentAt, … }` | exposure | Persist archive row |
| `listExposures({ limit, cursor? })` | pagination | `{ items, cursor? }` | Newest-first listing |
| `getExposure(n)` | issue number | exposure \| null | Detail |

## C5 — Exposure Counter

| Method | Input | Output | Purpose |
|--------|-------|--------|---------|
| `allocateNextIssueNumber()` | — | `number` | Atomic increment; production only |

## C6 — Exposure Public API

| Method | HTTP | Output | Purpose |
|--------|------|--------|---------|
| `list` | `GET /exposures` | exposure list DTO | Archive index |
| `get` | `GET /exposures/{n}` | exposure DTO | Archive detail |

## C7 — Exposure Site UI

| Method | Purpose |
|--------|---------|
| `loadExposuresList()` | Client/build fetch list |
| `loadExposure(n)` | Client/build fetch detail; render image + text + `/photos/{id}` link |

## C8 — Exposure Send Orchestrator

| Method | Trigger | Purpose |
|--------|---------|---------|
| `onSchedule(event)` | EventBridge cron | Main entry |
| `selectRandomCandidate()` | — | Pick one from candidates |
| `buildEmail(photo, n)` | photo + issue # | HTML/text + subject `Exposure #N · {title}` |
| `notifyEmptyPool()` | — | SES to AdminEmail |
| `emitCampaign(detail)` | NewsletterSendRequested fields | PutEvent on `newsletter-bus` |
| `finalizeSuccess(photoId, n, exposure)` | — | Stamp photo; ensure archive written (ordering detailed in Functional Design) |

## C9 — Newsletter Dispatch (existing)

| Method | Notes |
|--------|-------|
| Existing dispatch handler | `emailId` should carry Exposure issue number (or a stable campaign id derived from it) for `newsletter_sends` idempotency |

## C10 — Admin Notify

| Method | Purpose |
|--------|---------|
| Resolve `AdminEmail` | Env/param shared or mirrored from newsletter stack for orchestrator + test path |
