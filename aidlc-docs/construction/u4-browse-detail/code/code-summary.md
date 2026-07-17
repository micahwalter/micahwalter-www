# U4 — Browse & detail — Code Summary

**Stories**: US-007, US-008, US-009, US-010  
**Branch**: `cursor/u2-enrichment-functional-design-be02`

## What shipped

| Area | Files |
|------|--------|
| API client | `lib/photos-api.ts` — `listPhotos`, `getFeaturedPhoto`, `getPhoto`, `buildStaticMapUrl`, `prefetchPhotosForSearch`, cover helpers |
| Homepage | `components/HomePhotos.tsx`, `app/page.tsx` — API featured + recent; blog posts unchanged |
| Grid | `components/PhotosGrid.tsx`, `app/photos/page.tsx` — cursor Load more (12) |
| Detail | `app/photos/[id]/page.tsx`, `components/ApiPhotoDetail.tsx`, `PhotoStaticMap.tsx` |
| Mosaic | `components/ApiPhotoMosaic.tsx` — links to `/photos/<id>` |
| Search | `components/SearchBar.tsx` — prefetch ~100 photos + merge with posts.json |
| Redirects | `infra/infra.yml` — `/posts/<digits>` → 301 `/photos/<digits>`; `/photos/<digits>` URI rewrite → `/photos/0.html` shell |
| Local redirect | `app/posts/[slug]/page.tsx` — numeric slug → `/photos/<id>` |

## Static export note

`generateStaticParams` emits placeholder `id=0`. Production CloudFront rewrites `/photos/<digits>` to `/photos/0.html` while keeping the browser path; the client reads the id from `window.location.pathname`.

## Manual smoke checklist

- [ ] Set `NEXT_PUBLIC_PHOTO_API_URL=https://api.micahwalter.com/photos` in `.env.local`
- [ ] `npm run dev` — homepage featured/recent from API (or empty/Retry if no rows)
- [ ] `/photos` Load more
- [ ] `/photos/<id>` detail, EXIF, map when public geo present
- [ ] Search finds a photo → `/photos/<id>`
- [ ] `/posts/<numeric-id>` redirects to `/photos/<id>` (dev via Next; prod needs infra deploy)
- [ ] Blog `/posts/<slug>` unchanged
- [ ] `npm run build` succeeds
- [ ] Deploy `infra/infra.yml` (infra-deploy) for CF Function before relying on prod redirects/shells

## Out of scope (later units)

- Markdown photo migration (U7)
- Edit PATCH UI (U5)
- Galleries (U6)
