# U3 Code Summary — Upload UI

**Story**: US-001  
**Branch**: `cursor/u2-enrichment-functional-design-be02`

## What changed

- `lib/photos-api.ts` — `authWithPasscode`, `getUploadUrl`, `putToPresignedUrl` (XHR progress)
- `app/upload/UploadForm.tsx` — multi-file queue (max 20, concurrency 3), per-file title/caption/featured/progress
- `app/upload/page.tsx` — copy updated for multi-upload + API (no deploy wait)

## Env

- `NEXT_PUBLIC_PHOTO_API_URL=https://api.micahwalter.com/photos` (`.env.local` / CI)

## Smoke checklist

- [ ] Unlock with passcode
- [ ] Select multiple JPEG/PNG; titles prefilled; set captions/featured
- [ ] Reject PNG/JPEG over 20 with message; reject HEIC/other types
- [ ] Upload runs ~3 at a time; progress updates; done rows stay on page
- [ ] 401 mid-batch returns to locked
- [ ] Process writes DynamoDB; enricher may complete tags asynchronously
- [ ] No new `content/posts` markdown commit from upload

## Out of scope

- Edit/gallery hub (U5/U6)
- Browse/detail cutover (U4)
