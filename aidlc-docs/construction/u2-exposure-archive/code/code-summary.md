# U2 Code Summary — Exposure Archive

**Status**: Implemented locally  
**Branch**: `cursor/exposure-newsletter-6caf`

## Changes

| Area | Files |
|------|--------|
| DB | `infra/photo-upload-lambdas/src/lib/exposures-db.js` |
| API | `infra/photo-upload-lambdas/src/exposures-api.js` |
| CFN | `ExposuresTable`, `ExposuresApi` + mapping key `exposures`, Lambda |
| Client | `lib/exposures-api.ts` |
| Site | `app/exposures/page.tsx`, `app/exposures/[n]/page.tsx`, `ExposuresGrid`, `ExposureDetail` |

## Deploy notes

1. Rebuild/upload photo-upload zip (includes exposures-api handler)
2. Deploy photo-upload stack (creates table + `api.micahwalter.com/exposures` mapping)
3. Site build needs `NEXT_PUBLIC_PHOTO_API_URL` (derives exposures URL) or set `NEXT_PUBLIC_EXPOSURES_API_URL`

## Verification

- [ ] `GET https://api.micahwalter.com/exposures/` returns `{ items: [] }` when empty
- [ ] `/exposures` page loads
- [ ] After manual `createExposure` (or U3), detail `/exposures/1` works
