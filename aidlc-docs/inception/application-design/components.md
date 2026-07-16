# Components — Issues #103 / #104

**Scope**: Photo metadata DynamoDB migration + dynamic serving  
**Plan decisions**: Extend photo-upload stack; Node.js; async enrichment; `lib/photos-api.ts`; `/upload` hub + detail Edit shortcut; AWS Location reverse geocode; proposed component set

---

## PhotoRepository

- **Purpose**: Persist and retrieve photo metadata in DynamoDB
- **Responsibilities**: CRUD for photo records; query by publishedAt, featured; support search/filter fields used by PhotoQueryService
- **Interfaces**: Internal data-access API used by command/query/enrichment services (not HTTP-facing)

## GalleryRepository

- **Purpose**: Persist gallery definitions and ordered photo membership
- **Responsibilities**: Create/rename galleries; add/remove/reorder photo ids; load gallery by slug/id
- **Interfaces**: Internal data-access API for GalleryAdminService / GalleryQueryService

## PhotoCommandService

- **Purpose**: Authenticated writes to photo metadata
- **Responsibilities**: Create photo record (from process pipeline); update title/caption/tags/featured; validate auth token
- **Interfaces**: HTTP under `api.micahwalter.com/photos` (authenticated mutations); invoked by UploadProcessPipeline and admin UI

## PhotoQueryService

- **Purpose**: Public (and cacheable) photo reads
- **Responsibilities**: Get by id; list/paginate; featured; search/filter; strip precise GPS from public DTOs (expose fuzzed coords only)
- **Interfaces**: HTTP GET under `api.micahwalter.com/photos`

## GalleryAdminService

- **Purpose**: Authenticated gallery management
- **Responsibilities**: Create/rename galleries; mutate membership order; auth gate
- **Interfaces**: HTTP under `api.micahwalter.com/photos/galleries` (or equivalent admin paths)

## GalleryQueryService

- **Purpose**: Public gallery reads
- **Responsibilities**: List galleries; get gallery with resolved photo summaries for UI
- **Interfaces**: HTTP GET under `api.micahwalter.com/photos/galleries`

## UploadProcessPipeline

- **Purpose**: Handle S3 ObjectCreated for incoming uploads
- **Responsibilities**: Download original; optimize variants to images bucket; allocate ticket id; write initial photo record (status pending/enriching); enqueue enrichment; **do not** commit GitHub markdown
- **Interfaces**: S3 event trigger; calls PhotoCommandService / PhotoRepository; emits enrichment message

## EnrichmentService

- **Purpose**: Async post-upload enrichment
- **Responsibilities**: Ensure EXIF/GPS on record; fuzz public coordinates; AWS Location reverse geocode → city/country tags; Bedrock vision tags; merge tags; update enrichment status; failures logged without deleting photo
- **Interfaces**: SQS/EventBridge consumer; uses PhotoRepository; AWS Location; Bedrock

## PhotoAdminUI

- **Purpose**: Owner-facing Next.js admin surfaces
- **Responsibilities**: `/upload` hub — multi-file upload (per-file title/caption/featured + progress), photo edit list/forms, gallery admin; `/photos/[id]` authenticated Edit shortcut into hub/editor for that photo; passcode auth
- **Interfaces**: Browser → photo APIs via `lib/photos-api.ts` (auth writes)

## PhotoPublicUI

- **Purpose**: Visitor-facing photo surfaces
- **Responsibilities**: Homepage hero + recent photos; `/photos` grid; `/photos/[id]` detail (caption, tags, EXIF, static map when public geo present); public galleries; live search integration for photos
- **Interfaces**: Browser → PhotoQueryService / GalleryQueryService via `lib/photos-api.ts`

## RedirectLayer

- **Purpose**: Preserve legacy photo URLs
- **Responsibilities**: Permanent redirect `/posts/<photo-id>` → `/photos/<photo-id>` for migrated photo ids; leave blog slugs untouched
- **Interfaces**: CloudFront Function and/or static redirect artifacts

## FeedPublisher

- **Purpose**: Keep feeds current without full site rebuild
- **Responsibilities**: Scheduled job reads photo API/DB; updates RSS and/or sitemap photo entries with `/photos/<id>` URLs
- **Interfaces**: EventBridge schedule → Lambda; writes to feed artifacts location (S3/site bucket or agreed path)

## PhotosCLI

- **Purpose**: Desktop parity for import/retag
- **Responsibilities**: `blog photos:import` / `photos:tag` against API/DB (no markdown as source of truth)
- **Interfaces**: CLI → authenticated photo APIs
