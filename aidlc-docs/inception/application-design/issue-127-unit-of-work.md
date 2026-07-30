# Units of Work — Issue #127 Exposure

## Decomposition approach

Three sequential units (plan Q1=A). Construction uses a **lightweight combined design note per unit**, then Code Generation (Q4=B). U3 owns the Exposure counter (Q2=B). Photo-upload stack gets an `AdminEmail` CFN parameter (Q3=A).

## U1 — Eligibility and owner test send

| | |
|--|--|
| **Goal** | Owner can mark photos eligible and send a test Exposure to AdminEmail |
| **Type** | Module within photo-upload + Next.js edit UI |
| **Includes** | Photo fields `exposureEligible` (+ read-only display of sent fields when present); PATCH API; edit UI checkbox; authenticated test-send endpoint; `AdminEmail` CFN param wired for test path |
| **Excludes** | Public archive, schedule, counter allocate, subscriber blast, photo stamp |
| **FR coverage** | FR-1 (eligibility), FR-6 (test send), partial NFR auth |
| **Deploy** | photo-upload stack + site static rebuild for edit UI |

### Responsibilities
1. Extend photo schema/DTO/patch allowlist for `exposureEligible`
2. Edit panel: eligibility toggle; “Send test Exposure” control
3. Test handler builds one-photo email; delivers to AdminEmail only (prefer `NewsletterSendRequested` + `testEmail`)
4. Guarantee test does not allocate N, create archive, or stamp photo

## U2 — Exposure archive API and site

| | |
|--|--|
| **Goal** | Public Exposure archive browsable on site and via API |
| **Type** | Module within photo-upload + Next.js routes |
| **Includes** | Exposures DynamoDB table; `GET` list/detail on `api.micahwalter.com/exposures`; site `/exposures` and `/exposures/[n]`; client/lib for fetch |
| **Excludes** | Counter resource (U3); schedule; eligibility UI; writes except what U3 will call (U2 may expose internal create used by U3, or U3 writes via shared lib — prefer shared store module callable from orchestrator) |
| **FR coverage** | FR-7 |
| **Deploy** | photo-upload stack (table + API mapping) + site pages |

### Responsibilities
1. Define Exposure record shape (issueNumber, photoId, title, caption?, image URLs, sentAt, view URL fields)
2. Public read API + CORS
3. Site listing and detail pages linking to `/photos/{id}`
4. Leave create path available to U3 (library or internal API)

## U3 — Schedule, counter, production send

| | |
|--|--|
| **Goal** | Sunday automated Exposure to newsletter subscribers |
| **Type** | Module within photo-upload (orchestrator) + EventBridge + newsletter-bus |
| **Includes** | Dedicated Exposure counter (create + allocate); EventBridge rule Sun 09:00 America/New_York; orchestrator Lambda; random candidate select; archive create; emit `NewsletterSendRequested`; stamp photo; empty-pool SES to AdminEmail |
| **Excludes** | Edit UI; public read API (already U2) |
| **FR coverage** | FR-2, FR-3, FR-4, FR-5, FR-8 |
| **Deploy** | photo-upload stack (Lambda, rule, counter, IAM to bus); may need newsletter bus put permission |

### Responsibilities
1. Create counter; `allocateNextIssueNumber()`
2. Schedule → orchestrator entrypoint
3. Empty pool → AdminEmail notify
4. Production path: N → build email → create Exposure → PutEvents → stamp photo
5. Subject `Exposure #N · {title}`; `viewInBrowserUrl` → `/exposures/N`
6. Idempotency / stamp ordering documented in U3 lightweight design note

## Out of scope (all units)
- Owner CLI send
- Separate subscriber list
- Upload-form eligibility checkbox
- Security/Resiliency/PBT extensions
