# U4 — Browse & detail — Code Generation Plan

**Stories**: US-007, US-008, US-009, US-010  
**Design inputs**: `aidlc-docs/construction/u4-browse-detail/{functional-design,nfr-requirements,nfr-design,infrastructure-design}/`  
**Code location** (workspace root — never `aidlc-docs/` for app code):

| Area | Paths |
|------|--------|
| API client | `lib/photos-api.ts` (+ optional `lib/static-map.ts` if cleaner) |
| Homepage | `app/page.tsx`, new client component(s) under `components/` |
| Photos index | `app/photos/page.tsx`, client grid component |
| Detail | `app/photos/[id]/page.tsx` (+ client detail) |
| Search | `components/SearchBar.tsx` |
| Mosaic/cards | `components/PhotoMosaic.tsx` and/or API-aware variant |
| Redirects | `infra/infra.yml` (`StaticHTMLRoutingFunction`); optional dev fallback in `app/posts/[slug]/page.tsx` |
| Docs | `aidlc-docs/construction/u4-browse-detail/code/code-summary.md` |

**Approach**: Brownfield — client islands + extend existing helpers; CF Function merge (issue-90 pattern).

This plan is the **single source of truth** for U4 Code Generation.

---

## Unit context

| Item | Detail |
|------|--------|
| Deliverable | API-backed homepage hero/recent, `/photos` grid, `/photos/[id]`, live search photos, CF 301 `/posts/<id>` → `/photos/<id>` |
| Depends on | U1 photo API; U3 `lib/photos-api.ts` base; existing `NEXT_PUBLIC_PHOTO_API_URL` |
| Out of scope | Markdown hybrid; U5 edit PATCH; U6 galleries; U7 migration/feeds |

---

## Generation steps

### Step 1 — Extend `lib/photos-api.ts` (read + map)
- [ ] Add `PublicPhoto` type aligned with API DTO (`id`, `title`, `caption`, `publishedAt`, `featured`, `tags`, `exif`, `folderName`, `coverImageKey`, `publicLatitude`/`publicLongitude`, `city`/`country`, …)
- [ ] `listPhotos({ limit?, cursor? })` → `GET` list (trailing-slash safe); return `{ items, cursor }`
- [ ] `getFeaturedPhoto()` → `GET /featured` (null if empty/404)
- [ ] `getPhoto(id)` → `GET /{id}`; `PhotoApiError` on 404/failure
- [ ] `buildStaticMapUrl(lat, lon, opts?)` — OSM/staticmap-style URL
- [ ] Keep existing upload helpers unchanged

### Step 2 — API-aware image helpers / mosaic
- [ ] Helper to resolve CDN image paths from `folderName` + `coverImageKey` (or basename) for `CoverImage` / img URLs
- [ ] Update or add mosaic/card component that links to `/photos/<id>` (not `/posts/<id>`)
- [ ] Preserve existing visual language

### Step 3 — Homepage client islands (US-007)
- [ ] Replace markdown `getFeaturedPhoto` / `getPhotos` photo sections with client fetch
- [ ] Parallel `getFeaturedPhoto` + `listPhotos`; recent excludes featured id
- [ ] Loading / Retry / empty states; blog Recent Posts stays markdown
- [ ] Hero + recent links → `/photos/<id>`

### Step 4 — `/photos` grid (US-007)
- [ ] Client grid: `listPhotos` limit 12 + Load more via cursor
- [ ] Empty-state copy when API returns zero
- [ ] Keep page metadata/header shell

### Step 5 — `/photos/[id]` detail (US-008)
- [ ] New route with placeholder `generateStaticParams` (static export)
- [ ] Client detail: title, image, caption, tags, EXIF, optional static map (hide on error / no geo)
- [ ] 404 / error + Retry UX
- [ ] Edit stub placeholder only (no PATCH); no “Edit on GitHub” for API photos
- [ ] Comments/giscus: use `/photos/<id>` pathname if Comments wired

### Step 6 — SearchBar live photos (US-010)
- [ ] On open: bounded prefetch (~100) via list pages + filter title/caption/tags
- [ ] Merge with existing `posts.json` results; photo hits → `/photos/<id>`
- [ ] No per-keystroke API calls

### Step 7 — CloudFront redirect (US-009)
- [ ] In `infra/infra.yml` `StaticHTMLRoutingFunction`: `/posts/<digits>` → 301 `/photos/<digits>` **before** legacy redirects / `.html` rewrite
- [ ] Non-numeric `/posts/<slug>` unchanged
- [ ] Optional: Next.js redirect in `app/posts/[slug]` when slug is all digits (dev/local without CF)

### Step 8 — Construction summary
- [ ] `aidlc-docs/construction/u4-browse-detail/code/code-summary.md` + manual smoke checklist (home, grid, detail, map, search, redirect)

### Step 9 — Local verification
- [ ] `npm run build` succeeds
- [ ] No new test framework; manual checklist in summary
- [ ] Do not commit `public/mastodon.json` if rewritten by prebuild

---

## Story traceability

| Story | Steps |
|-------|-------|
| US-007 Browse | 1–4 |
| US-008 Detail | 1, 5 |
| US-009 Redirects | 7 |
| US-010 Search | 1, 6 |

---

## Approval

Approve this plan to begin Part 2 implementation.
