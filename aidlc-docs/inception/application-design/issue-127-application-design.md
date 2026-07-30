# Application Design — Issue #127 Exposure

Consolidated design for the Exposure periodic photo newsletter. Detail docs: `issue-127-components.md`, `issue-127-component-methods.md`, `issue-127-services.md`, `issue-127-component-dependency.md`.

## Design decisions (from plan Q&A)

| Topic | Choice |
|-------|--------|
| Exposure API + DynamoDB | Photo-upload stack |
| Send orchestrator Lambda | Photo-upload package |
| Subscriber delivery | Emit `NewsletterSendRequested` → `newsletter-bus` |
| Issue counter | Dedicated DynamoDB counter in photo stack |
| Public API | `https://api.micahwalter.com/exposures` |
| Site routes | `/exposures`, `/exposures/[n]` |

## Component map

| ID | Component | Home |
|----|-----------|------|
| C1 | Photo Metadata Store | Photos DynamoDB |
| C2 | Photo Owner API | photos HTTP API |
| C3 | Photo Edit UI | `/upload` edit panel |
| C4 | Exposure Archive Store | Exposures DynamoDB |
| C5 | Exposure Counter | DynamoDB counter |
| C6 | Exposure Public API | `api…/exposures` |
| C7 | Exposure Site UI | `/exposures*` |
| C8 | Exposure Send Orchestrator | EventBridge + Lambda (photo-upload) |
| C9 | Newsletter Dispatch | Existing newsletter stack |
| C10 | Admin Notify | `AdminEmail` |

## Key flows

1. **Eligibility** — Edit UI PATCH → photo `exposureEligible`
2. **Test** — Edit UI → owner test endpoint → AdminEmail only (no stamp / no issue)
3. **Sunday send** — Orchestrator → random candidate → allocate N → archive → bus → stamp; empty → AdminEmail
4. **Browse** — Site → public exposures API → archive store

## Traceability to requirements

| FR | Covered by |
|----|------------|
| FR-1 Eligibility | C1–C3 |
| FR-2 Sent tracking | C1, C8 |
| FR-3 Counter | C5, C8 |
| FR-4 Schedule send | C8, C9 |
| FR-5 Empty pool | C8, C10 |
| FR-6 Test send | C2, C3, C9/C10 |
| FR-7 Archive site | C4, C6, C7 |
| FR-8 Newsletter integration | C8, C9 |

## Open for Construction (not blocking this stage)

- Exact stamp-vs-emit ordering / idempotency for retries
- How photo-upload stack obtains `AdminEmail` (mirror CFN param vs SSM/Secrets)
- Test subject line prefix wording
- Whether `emailId` in `NewsletterSendRequested` equals Exposure `N` directly

## Next stage

Units Generation — finalize U1/U2/U3 boundaries from execution plan preview.
