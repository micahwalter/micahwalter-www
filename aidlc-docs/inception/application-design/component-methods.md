# Component Methods — Issues #103 / #104

High-level signatures only. Detailed business rules → Functional Design (per unit).

---

## PhotoRepository

| Method | Input | Output | Purpose |
|--------|-------|--------|---------|
| `putPhoto(photo)` | PhotoRecord | void | Insert/overwrite photo |
| `updatePhoto(id, patch)` | id, partial fields | PhotoRecord | Partial update |
| `getPhoto(id)` | id | PhotoRecord \| null | Load by id |
| `listPhotos(query)` | pagination, filters | { items, cursor } | Newest-first list |
| `getFeaturedPhoto()` | — | PhotoRecord \| null | Newest featured, else newest |
| `searchPhotos(q, query)` | text + pagination | { items, cursor } | Title/caption/tags search |

## GalleryRepository

| Method | Input | Output | Purpose |
|--------|-------|--------|---------|
| `putGallery(gallery)` | GalleryRecord | void | Create/overwrite |
| `updateGallery(id, patch)` | id, patch | GalleryRecord | Rename / membership |
| `getGallery(idOrSlug)` | id or slug | GalleryRecord \| null | Load one |
| `listGalleries()` | — | GalleryRecord[] | Admin/public list |

## PhotoCommandService

| Method | Input | Output | Purpose |
|--------|-------|--------|---------|
| `createFromUpload(meta)` | title, caption, featured, folderName, imageKeys, exif… | PhotoRecord | Persist after process |
| `updateMetadata(id, patch, token)` | id, fields, auth | PhotoRecord | Owner edit |
| `assertAuth(token)` | token | void / throw | Validate HMAC session |

## PhotoQueryService

| Method | Input | Output | Purpose |
|--------|-------|--------|---------|
| `getPublicPhoto(id)` | id | PublicPhotoDTO | Detail DTO (fuzzed geo) |
| `listPublicPhotos(query)` | pagination | page of PublicPhotoDTO | `/photos` grid |
| `getFeaturedPublic()` | — | PublicPhotoDTO \| null | Homepage hero |
| `searchPublic(q, query)` | text + page | page of PublicPhotoDTO | Live search |

## GalleryAdminService

| Method | Input | Output | Purpose |
|--------|-------|--------|---------|
| `createGallery(input, token)` | name/slug, token | GalleryRecord | Create |
| `renameGallery(id, name, token)` | … | GalleryRecord | Rename |
| `setMembership(id, photoIds[], token)` | ordered ids | GalleryRecord | Replace order |
| `addPhoto` / `removePhoto` | id, photoId, token | GalleryRecord | Incremental edits |

## GalleryQueryService

| Method | Input | Output | Purpose |
|--------|-------|--------|---------|
| `getPublicGallery(slug)` | slug | Gallery with photo summaries | Public page |
| `listPublicGalleries()` | — | summaries | Index |

## UploadProcessPipeline

| Method | Input | Output | Purpose |
|--------|-------|--------|---------|
| `handleObjectCreated(event)` | S3 event | void | Main handler |
| `optimizeAndStore(buffer, folder)` | bytes, folder | imageKeys | CDN variants + original |
| `allocateId()` | — | id | Tickets API |
| `persistPending(record)` | PhotoRecord | void | Fast write |
| `enqueueEnrichment(id)` | id | void | SQS/EventBridge |

## EnrichmentService

| Method | Input | Output | Purpose |
|--------|-------|--------|---------|
| `enrich(id)` | photo id | void | Full enrichment pass |
| `extractOrLoadExif(photo)` | record / S3 | exif+gps | Ensure EXIF |
| `fuzzCoordinates(lat, lon)` | precise | publicLat/Lon | Privacy |
| `reverseGeocode(lat, lon)` | precise | { city, country } | AWS Location |
| `tagWithBedrock(imageRef)` | image | string[] | Vision tags |
| `mergeTags(...tagSets)` | arrays | string[] | Dedupe merge |

## PhotoAdminUI / PhotoPublicUI (Next.js)

| Surface | Key behaviors |
|---------|----------------|
| Upload hub | Multi-file select; per-file fields; progress; call init + PUT + poll/status as designed |
| Edit shortcut | On `/photos/[id]` when authed → open editor for that id |
| Gallery admin | CRUD membership UI on hub |
| Public pages | Call `lib/photos-api.ts` helpers; render caption/map conditionally |

### `lib/photos-api.ts` (shared client)

| Function | Purpose |
|----------|---------|
| `getPhoto(id)` | Public detail |
| `listPhotos(params)` | Paginated list |
| `getFeaturedPhoto()` | Hero |
| `searchPhotos(q, params)` | Search |
| `updatePhoto(id, patch, token)` | Auth write |
| `listGalleries` / `getGallery` / gallery admin helpers | Galleries |

## RedirectLayer

| Method | Purpose |
|--------|---------|
| `resolveLegacyPostPath(path)` | If numeric photo id → 301 to `/photos/<id>` |

## FeedPublisher

| Method | Purpose |
|--------|---------|
| `runScheduledPublish()` | Rebuild photo feed/sitemap fragments from API/DB |

## PhotosCLI

| Command mapping | Purpose |
|-----------------|---------|
| `photos:import` | Upload/register via API |
| `photos:tag` | Trigger/retag enrichment via API |
