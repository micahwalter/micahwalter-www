# U4 — Browse & detail — Code Generation Plan

**Stories**: US-007, US-008, US-009, US-010  
**Design inputs**: `aidlc-docs/construction/u4-browse-detail/{functional-design,nfr-requirements,nfr-design,infrastructure-design}/`  
**Code location** (workspace root — never `aidlc-docs/` for app code):

| Area | Paths |
|------|--------|
| API client | `lib/photos-api.ts` |
| Homepage | `app/page.tsx`, `components/HomePhotos.tsx` |
| Photos index | `app/photos/page.tsx`, `components/PhotosGrid.tsx` |
| Detail | `app/photos/[id]/page.tsx`, `ApiPhotoDetail`, `PhotoStaticMap` |
| Search | `components/SearchBar.tsx` |
| Mosaic | `components/ApiPhotoMosaic.tsx` |
| Redirects | `infra/infra.yml`; `app/posts/[slug]/page.tsx` |
| Docs | `aidlc-docs/construction/u4-browse-detail/code/code-summary.md` |

**Approach**: Brownfield — client islands + extend helpers; CF Function merge.

This plan is the **single source of truth** for U4 Code Generation.

---

## Generation steps

### Step 1 — Extend `lib/photos-api.ts` (read + map)
- [x] Add `PublicPhoto` type aligned with API DTO
- [x] `listPhotos({ limit?, cursor? })`
- [x] `getFeaturedPhoto()`
- [x] `getPhoto(id)`
- [x] `buildStaticMapUrl` + `prefetchPhotosForSearch`
- [x] Keep existing upload helpers unchanged

### Step 2 — API-aware image helpers / mosaic
- [x] `photoCoverFilename` / `photoIdString`
- [x] `ApiPhotoMosaic` links to `/photos/<id>`

### Step 3 — Homepage client islands (US-007)
- [x] `HomePhotos` parallel featured + list; recent excludes featured
- [x] Loading / Retry / empty; blog Recent Posts stays markdown
- [x] Links → `/photos/<id>`

### Step 4 — `/photos` grid (US-007)
- [x] Client grid limit 12 + Load more
- [x] Empty-state copy

### Step 5 — `/photos/[id]` detail (US-008)
- [x] Placeholder `generateStaticParams` (`id=0`)
- [x] Client detail + map + EXIF; Edit stub hidden
- [x] 404 / Retry; Comments via pathname

### Step 6 — SearchBar live photos (US-010)
- [x] Bounded prefetch ~100; merge with posts.json
- [x] Photo hits → `/photos/<id>`

### Step 7 — CloudFront redirect (US-009)
- [x] `/posts/<digits>` → 301 `/photos/<digits>`
- [x] `/photos/<digits>` URI rewrite → `/photos/0.html` shell
- [x] Next.js numeric slug redirect for local/dev

### Step 8 — Construction summary
- [x] `code-summary.md` + smoke checklist

### Step 9 — Local verification
- [x] `npm run build` succeeds (`/photos`, `/photos/0` exported)
- [x] No new test framework
- [x] Do not commit `public/mastodon.json` if rewritten

---

## Approval

Plan approved 2026-07-17 (`Yes do a commit first and then implement`).
