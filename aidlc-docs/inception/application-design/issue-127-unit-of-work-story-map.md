# Unit ↔ Requirements Map — Issue #127 Exposure

User Stories stage was skipped. This map assigns **functional requirements** (and key decisions) to units.

## FR → Unit

| Requirement | Unit | Notes |
|-------------|------|-------|
| FR-1 Eligibility | **U1** | Flag + edit UI + PATCH |
| FR-2 Sent tracking | **U3** | Stamp after production send; U1 may display fields |
| FR-3 Issue counter | **U3** | Dedicated counter create + allocate |
| FR-4 EventBridge schedule send | **U3** | Cron + orchestrator + bus emit |
| FR-5 Empty pool notify | **U3** | SES to AdminEmail |
| FR-6 Owner test send | **U1** | Edit UI + test API |
| FR-7 Exposure archive site/API | **U2** | Table, public API, `/exposures*` |
| FR-8 Newsletter integration | **U3** | Same subscribers via `NewsletterSendRequested` |

## Decision → Unit

| Decision | Unit |
|----------|------|
| Same subscriber list | U3 |
| Random selection | U3 |
| Link to `/photos/{id}` | U1 (test body), U3 (prod body), U2 (archive page) |
| Subject `Exposure #N · {title}` | U3 (prod); U1 test may use Test prefix |
| Sunday 09:00 America/New_York | U3 |
| AdminEmail CFN on photo-upload | U1 (introduce), U3 (reuse) |
| API `api…/exposures` + site `/exposures` | U2 |
| No CLI | all |

## Acceptance criteria → Unit

| Criterion | Unit |
|-----------|------|
| Mark exposureEligible from edit UI | U1 |
| Sunday send when inventory exists | U3 |
| Random among eligible unsent public | U3 |
| Subject with dedicated N | U3 |
| Stamp after subscriber send; not after test | U3 / U1 |
| Test to AdminEmail only | U1 |
| Empty pool → AdminEmail | U3 |
| `/exposures` + `/exposures/[n]` | U2 |
| Email links to `/photos/{id}` | U1, U3 |
| Docs for schedule, AdminEmail, UX | each unit’s code summary + Build and Test |
