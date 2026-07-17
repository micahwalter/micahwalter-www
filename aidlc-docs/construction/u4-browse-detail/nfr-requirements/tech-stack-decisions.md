# U4 — Tech Stack Decisions

## Confirmed stack

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Site framework | **Next.js 15 App Router** + `output: "export"` (prod) | Existing blog; NFR-2 |
| Photo data access | **`lib/photos-api.ts`** + browser `fetch` | FD / App Design locked |
| Photo API | Existing **`api.micahwalter.com/photos`** (U1) | list / featured / get |
| UI language | **TypeScript + React client components** | Match repo |
| Styling | Existing **Tailwind** design tokens | Preserve site look |
| Pagination UX | Cursor **Load more**, page size **12** | FD + U1 API |
| Search | `posts.json` + **client filter** on prefetched photos | Q2=A; no new search API |
| Static maps | **OSM / staticmap-style `<img>` URL** | FD Q3=B; hide on error |
| Legacy redirects | **CloudFront Function** 301 | FD Q4=A |
| Detail static export | Client page + **placeholder `generateStaticParams`** | Q5=A |
| Client cache | **None** beyond browser defaults | Q6=A |
| SEO | Accept client-rendered for U4 | Q1=A |

## Explicitly deferred

| Item | Defer to |
|------|----------|
| Strong SEO / OG for photo detail | Later / U7 or bake improvement |
| Backend `?q=` photo search | Later if catalog grows |
| Mapbox / AWS Location static maps | Not U4 (OSM chosen) |
| Markdown hybrid browse | Not U4 (API-only) |
| Authenticated edit PATCH UI | U5 |
| Multi-region API | U7 |
| API response CDN caching | Later (U1 deferred) |

## External services

| Service | Use | Failure mode |
|---------|-----|--------------|
| Photo API | Metadata | Retry UI; empty/error states |
| Image CDN (`/images/*`) | Photo binaries | Existing broken-image behavior locally |
| OSM static map host | Map thumbnail | Hide map on load error |
| CloudFront | WWW + redirect Function | Blog pass-through must remain safe |
