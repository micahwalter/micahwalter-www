# U3 Code Summary — Schedule + Production Send

**Status**: Implemented  
**Branch**: `cursor/exposure-newsletter-6caf`

## Changes

| Area | Files |
|------|--------|
| Orchestrator | `src/exposure-orchestrator.js` |
| Counter/lock | `src/lib/exposure-counter.js` |
| Photos DB | `listExposureCandidates`, `stampExposureSent` |
| CFN | `ExposureCounterTable`, `ExposureOrchestratorFn`, `ExposureSundaySchedule` (Scheduler) |
| Deps | `@aws-sdk/client-ses` |

## Behavior

- Schedule: Sunday **09:00 America/New_York**
- Daily lock prevents double-run
- Empty pool → SES email to `AdminEmail`
- Otherwise random eligible unsent → allocate N → archive → `NewsletterSendRequested` → stamp photo

## Deploy notes

1. `cd infra/photo-upload-lambdas && make build` (pulls SES SDK + zips)
2. Upload zip + deploy photo-upload stack
3. Confirm SES can send from `AdminEmail`
4. Optional test: invoke `photo-upload-exposure-orchestrator` once (consumes that NY calendar day’s lock)

## Manual test invoke

```bash
aws lambda invoke --function-name photo-upload-exposure-orchestrator \
  --payload '{}' /tmp/exposure-out.json --profile www
cat /tmp/exposure-out.json
```
