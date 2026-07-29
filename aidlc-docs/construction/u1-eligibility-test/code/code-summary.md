# U1 Code Summary — Eligibility + Owner Test Send

**Status**: Implemented (awaiting deploy + review)  
**Branch**: `cursor/exposure-newsletter-6caf`

## Changes

| Area | Files |
|------|--------|
| Email helper | `infra/photo-upload-lambdas/src/lib/exposure-email.js` |
| Bus emit | `infra/photo-upload-lambdas/src/lib/newsletter-events.js` |
| Schema/DTO/DB | `photo-defaults.js`, `photo-dto.js`, `photos-db.js` |
| API | `photos-api.js` — PATCH `exposureEligible`; `POST /{id}/exposure-test` |
| CFN | `infra/photo-upload.yml` — `AdminEmail`, `NewsletterEventBusName`, IAM PutEvents, route, env |
| Client | `lib/photos-api.ts` — types, patch field, `sendExposureTest` |
| UI | `app/upload/PhotoEditPanel.tsx` — Eligible checkbox, sent display, test button |

## Behavior

- Save persists `exposureEligible` with other edit fields
- Test queues `NewsletterSendRequested` with `testEmail=ADMIN_EMAIL` (no stamp, `emailId=0`)
- Draft photos rejected for test

## Deploy notes

1. Build/upload photo-upload Lambda zip (`cd infra/photo-upload-lambdas && make build` / existing workflow)
2. Deploy `micahwalter-photo-upload` with `AdminEmail` matching newsletter admin
3. Redeploy site (or preview) so edit UI ships
4. Confirm `NEXT_PUBLIC_PHOTO_API_URL` points at live photos API

## Verification

- [ ] PATCH eligibility round-trips in edit UI
- [ ] Test button → AdminEmail only (check inbox / CloudWatch)
- [ ] Photo record not stamped after test
