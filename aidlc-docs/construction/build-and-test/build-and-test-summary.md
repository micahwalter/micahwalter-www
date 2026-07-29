# Build and Test Summary — Issue #127 Exposure

## Units covered

| Unit | Delivered |
|------|-----------|
| U1 | Eligibility + edit UI + AdminEmail test send |
| U2 | Exposures table + public API + `/exposures` site |
| U3 | Counter, Sunday Scheduler, orchestrator, empty-pool notify |

## Local validation (this environment)

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | Pass |
| `node --check` on new Lambda entrypoints | Pass |
| `npm install` in `infra/photo-upload-lambdas` (incl. SES SDK) | Pass |
| `npm run build` (includes `/exposures`) | Pass |
| Full AWS deploy / live SES / subscriber send | **Pending** (needs `www` SSO + stack deploy) |

## Instruction index

- [build-instructions.md](./build-instructions.md)  
- [unit-test-instructions.md](./unit-test-instructions.md)  
- [integration-test-instructions.md](./integration-test-instructions.md)  
- [performance-test-instructions.md](./performance-test-instructions.md)  

## Acceptance checklist (from requirements)

- [ ] Mark `exposureEligible` from edit UI  
- [ ] Sunday 09:00 America/New_York schedule exists  
- [ ] Random eligible unsent send to newsletter subscribers  
- [ ] Subject `Exposure #N · {title}` with dedicated counter  
- [ ] Stamp after production send; not after test  
- [ ] Test → AdminEmail only  
- [ ] Empty pool → AdminEmail  
- [ ] `/exposures` + `/exposures/[n]`  
- [ ] Email links to `/photos/{id}`  
- [ ] Docs for schedule / AdminEmail / UX  

## Branch

`cursor/exposure-newsletter-6caf` — commits U1 `87c73d2`, U2 `5a08629`, U3 `65a1e74` (+ this Build and Test docs commit).
