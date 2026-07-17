# Code Generation Plan — photo-ux-polish

**Unit**: `photo-ux-polish` (single unit; Units Generation skipped)  
**Stories**: US-1 … US-5 · **Requirements**: FR-1 … FR-5  
**Workspace root**: `/workspace`  
**This plan is the single source of truth for Code Generation.**

## Context
- Brownfield Next.js 15 static export blog + DynamoDB photos API
- Extensions: Security / Resiliency / PBT disabled
- Do **not** reintroduce HTTP API `$default` (breaks CORS OPTIONS)

## Dependencies
- OSM tiles/embed reachable in browser (no API key)
- Existing `NEXT_PUBLIC_PHOTO_API_URL`, CDN image URLs
- Photo-upload CFN stacks for FR-5 deploy

## Expected contracts
- Photo detail: map + place label from public coords/city/country
- `/photos?tag=` client-filtered list
- Homepage skeleton while client-fetching
- Gallery detail grid in `max-w-wide mx-auto px-6`
- `GET /photos` (no trailing slash) lists like `GET /photos/` without breaking CORS

---

## Story mapping
| Story | Plan steps |
|-------|------------|
| US-1 / FR-1 | Steps 1–2 |
| US-2 / FR-2 | Steps 3–4 |
| US-3 / FR-3 | Step 5 |
| US-4 / FR-4 | Step 6 |
| US-5 / FR-5 | Steps 7–8 |
| Docs / verify | Steps 9–10 |

---

## Execution steps

### Step 1 — Replace dead static map with OSM in-page map (US-1)
- [ ] Modify `lib/photos-api.ts`: remove or stop using `buildStaticMapUrl` pointing at `staticmap.openstreetmap.de`; keep a helper for OSM link-out URL from public lat/lon
- [ ] Rewrite `components/PhotoStaticMap.tsx` to render an in-page OpenStreetMap-based map **without an API key** (prefer lightweight approach: OSM embed iframe **or** small client tile map). Must not block the rest of the page
- [ ] Always render place label (`city`, `country`) when available, even if the map fails
- [ ] Preserve external OpenStreetMap link using public/fuzzed coordinates only

### Step 2 — Wire place label on photo detail (US-1)
- [ ] Update `components/ApiPhotoDetail.tsx` so place text is visible independently of map success (if not fully handled inside `PhotoStaticMap`)
- [ ] Keep map gated on valid `publicLatitude` / `publicLongitude` numbers

### Step 3 — Make photo tags clickable (US-2)
- [ ] In `components/ApiPhotoDetail.tsx`, change tag chips from `<span>` to `<Link href={/photos?tag=...}>` with existing hover chip styles (`hover:border-gray hover:bg-gray/10`)
- [ ] URL-encode tag values safely

### Step 4 — Honor `?tag=` on photos index (US-2)
- [ ] Update `components/PhotosGrid.tsx` (and/or `app/photos/page.tsx` if needed) to read `tag` from the URL (`window.location` / `useSearchParams` pattern compatible with static export)
- [ ] Filter listed DynamoDB photos case-insensitively by tag
- [ ] Show a clear empty state when no matches; do not error
- [ ] Show active filter affordance (e.g. “Tagged: X” + clear link back to `/photos`)
- [ ] Prefetch enough pages for filter if current pagination would miss matches (reuse or extend `prefetchPhotosForSearch` / list pagination as needed for a correct filtered set)

### Step 5 — Homepage featured skeleton (US-3)
- [ ] Update `components/HomePhotos.tsx`: replace primary “Loading photos…” text with a skeleton / reserved aspect-ratio placeholder matching site design
- [ ] Keep client `getFeaturedPhoto` + `listPhotos` fetch
- [ ] Preserve error + Retry UI
- [ ] Minimize layout shift when featured image appears

### Step 6 — Galleries detail layout (US-4)
- [ ] Wrap gallery detail grid in `max-w-wide mx-auto px-6` (and matching vertical padding) — either in `components/ApiGalleryDetail.tsx` around `GalleryViewer`, or inside `components/GalleryViewer.tsx` for the grid only (lightbox stays full-bleed)
- [ ] Tighten gallery detail header spacing to align with other listing/detail headers (`ApiGalleryDetail` / page header)

### Step 7 — Bare `GET /photos` API path (US-5)
- [ ] Investigate ApiMapping behavior for `https://api.micahwalter.com/photos` vs `/photos/`
- [ ] Implement a fix that does **not** reintroduce `$default` intercepting OPTIONS (candidates: explicit route if supported; CloudFront/API domain rewrite `/photos` → `/photos/`; or OPTIONS-safe alternative documented in the step notes)
- [ ] Update `infra/photo-upload.yml` and `infra/photo-upload-secondary.yml` as needed
- [ ] Verify with curl: `OPTIONS` → 204, `GET /photos` and `GET /photos/` → 200 list JSON

### Step 8 — Deploy notes for API change
- [ ] Document in code summary how to deploy the photo-upload stack(s) after merge (existing GHA workflow)
- [ ] Do not commit secrets; no `$default` regression

### Step 9 — Code summary documentation
- [ ] Write `aidlc-docs/construction/photo-ux-polish/code/code-summary.md` listing modified/created files and story coverage

### Step 10 — Local verification
- [ ] Run `npm run build`
- [ ] Smoke: tag link shape, skeleton present in code, gallery wrapper classes, map component no longer references dead host
- [ ] If AWS creds available: curl bare `/photos` + OPTIONS; spot-check photo `171` JSON still has coords

---

## Out of scope (do not implement)
- Build-time bake of featured photo
- Extending `/tags/[tag]` with DynamoDB photos
- Re-enrichment of photos lacking GPS
- Enabling Security / Resiliency / PBT extensions

## Branch
- Create/use `cursor/photo-ux-polish-be02` off `main` for implementation (Part 2)
