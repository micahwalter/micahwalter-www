# U1 Code Generation Plan — Eligibility + Test Send

**Unit**: U1  
**Design**: `aidlc-docs/construction/u1-eligibility-test/lightweight-design.md`  
**FR**: FR-1, FR-6

## Context

- Brownfield: extend photo-upload Lambda/API, CFN, Next.js edit UI, `lib/photos-api.ts`
- Depends on: existing photo auth, newsletter-bus + dispatch test mode
- Does not implement U2/U3

## Steps

- [x] Step 1: Extend photo DTO + defaults — `exposureEligible`, `exposureSentAt`, `exposureIssueNumber` in `photo-dto.js` / `photo-defaults.js` as needed
- [x] Step 2: Extend `photos-db.updatePhoto` allowlist for `exposureEligible`
- [x] Step 3: Extend `photos-api.js` PATCH to accept `exposureEligible`; add `POST /{id}/exposure-test` (auth required) building email + `PutEvents` `NewsletterSendRequested` with `testEmail`
- [x] Step 4: Add shared helper module for Exposure email HTML/text build (reusable by U3 later) under `infra/photo-upload-lambdas/src/lib/`
- [x] Step 5: Update `infra/photo-upload.yml` — `AdminEmail` param, env vars, IAM `events:PutEvents` on newsletter bus; API Gateway route for exposure-test
- [x] Step 6: Extend `lib/photos-api.ts` — types, `updatePhoto` field, `sendExposureTest(id, token)`
- [x] Step 7: Update `app/upload/PhotoEditPanel.tsx` — eligibility checkbox, sent display, test button
- [x] Step 8: Write `aidlc-docs/construction/u1-eligibility-test/code/code-summary.md`
- [x] Step 9: Sanity check — `node` syntax / TypeScript build or targeted review; note deploy steps for photo-upload stack

## Success criteria

- Owner can toggle eligibility and save
- Test button sends only to AdminEmail via newsletter test path
- No stamp / no archive / no subscriber query on test
