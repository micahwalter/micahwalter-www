# U1 Lightweight Design — Eligibility + Owner Test Send

**Unit**: U1  
**Issue**: #127  
**Depth**: Combined design note (Units Q4=B)

## Scope

Owner marks `exposureEligible` on photos via edit UI; sends a test Exposure email to `AdminEmail` without stamping, allocating an issue number, creating an archive row, or emailing subscribers.

## Data

| Field | Type | Notes |
|-------|------|-------|
| `exposureEligible` | boolean | Default false; owner PATCH |
| `exposureSentAt` | string \| null | Read-only in U1 UI if present; written in U3 |
| `exposureIssueNumber` | number \| null | Read-only in U1 UI if present; written in U3 |

## API

| Route | Auth | Behavior |
|-------|------|----------|
| `PATCH /photos/{id}` | Session | Allow `exposureEligible` in patch allowlist |
| `POST /photos/{id}/exposure-test` | Session | Load photo; if missing/draft → 400/404; build HTML/text; emit `NewsletterSendRequested` with `testEmail=AdminEmail`; `emailId=0` (or non-colliding sentinel); subject `Test · Exposure · {title}`; no DynamoDB sent stamp |

## Email body (test)

- Image: CDN URL from existing photo cover helpers (same as site)
- Title (+ caption if present)
- Link image/title to `{SITE_URL}/photos/{id}`
- Prefer EventBridge → existing dispatch test path

## Infra (photo-upload.yml)

- Parameter `AdminEmail` (String, default `micah@micahwalter.com`)
- Parameter/env `NewsletterEventBusName` default `newsletter-bus` (or hardcode known name with IAM)
- Env on photos-api (and any dedicated handler): `ADMIN_EMAIL`, `EVENT_BUS_NAME`, `SITE_URL` (already), images CDN base as already used
- IAM: `events:PutEvents` on newsletter bus ARN

## UI (`PhotoEditPanel`)

- Checkbox “Eligible for Exposure” bound to `exposureEligible`
- Show sent state if `exposureSentAt` / issue number present
- Button “Send test Exposure” → `POST …/exposure-test`; success/error toast/text
- Save still PATCHes title/caption/tags/featured/**exposureEligible**

## NFR (light)

- Auth same as existing PATCH
- Test must never omit `testEmail`
- Log photo id + AdminEmail domain only (not full PII spam)

## Out of U1

- Schedule, counter, archive table, `/exposures` pages, production blast, photo stamp writes
