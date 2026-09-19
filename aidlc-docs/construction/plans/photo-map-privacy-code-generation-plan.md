# Code Generation Plan — Photo Map Privacy (Neighborhood-Scale)

**Unit**: `photo-map-privacy`  
**Requirements**: `aidlc-docs/inception/requirements/requirements.md`  
**Status**: Part 2 — Generation COMPLETE

## Steps

- [x] **Step 1** — Update `infra/photo-upload-lambdas/src/lib/geo.js`: `fuzzPublicCoords` rounds to **2** decimal places
- [x] **Step 2** — Add `infra/photo-upload-lambdas/src/lib/geo.test.js`
- [x] **Step 3** — Update `lib/photos-api.ts`: larger bbox, omit `marker=`; browse zoom 11 without pin
- [x] **Step 4** — Update `components/PhotoStaticMap.tsx` (“Approximate area” copy)
- [x] **Step 5** — Document backfill (`backfill-notes.md` + README); enricher falls back to stored private GPS
- [x] **Step 6** — Update `infra/photo-upload-lambdas/README.md`
- [x] **Step 7** — Run enricher unit tests (32 pass) and `npm run build` (success)
- [x] **Step 8** — Write `aidlc-docs/construction/photo-map-privacy/code/code-summary.md`
