# Code Generation Plan — U6 Galleries

**Unit**: U6 Galleries  
**Depth**: Standard  
**Date**: 2026-07-16  
**Status**: Part 2 complete — awaiting approval

## Preconditions

- [x] U4 public photo detail at `/photos/<id>`
- [x] U5 hub + admin session token
- [x] Photos API + DynamoDB live

## Part 1 — Planning (approved)

- [x] Plan created and approved ("yes begin")

## Part 2 — Generation steps

### A. Backend / infra

- [x] A1. `GalleriesTable` in `photo-upload.yml` (PK `slug`)
- [x] A2. IAM + `GALLERIES_TABLE` on PhotosApiFn
- [x] A3. API Gateway routes for galleries
- [x] A4. `galleries-db.js` + handlers in `photos-api.js`
- [x] A5. github-actions-role galleries DDB perms
- [x] A6. CloudFront Function rewrite for `/galleries/<slug>`

### B. Frontend client

- [x] B1. Gallery helpers in `lib/photos-api.ts`
- [x] B2. `resolveGalleryPhotos` via existing photo GETs

### C. Admin UI

- [x] C1. `GalleryAdminPanel.tsx`
- [x] C2. Galleries tab in `UploadHub`

### D. Public UI

- [x] D1. `ApiGalleriesIndex` / `ApiGalleryCard` / `ApiGalleryDetail`
- [x] D2. Replace `app/galleries` pages with API shells
- [x] D3. `GalleryViewer` → `/photos/<id>`
- [x] D4. Placeholder slug for static export

### E. Migration

- [x] E1. `scripts/migrate-galleries.js` (dry-run / `--apply`)

### F. Docs / verify

- [x] F1. `code-summary.md`
- [x] F2. Plan checkboxes
- [x] F3. `npm run build` with API URL
- [x] F4. State + audit

## Explicit non-goals (U6)

- No gallery delete API
- No Mapbox
- No U7 markdown purge
