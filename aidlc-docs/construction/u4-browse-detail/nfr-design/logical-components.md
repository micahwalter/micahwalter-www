# U4 — Logical Components

Minimal set (Q6=A). Infrastructure binding (CF Function code) → Infrastructure Design.

---

## PhotosApiClient (`lib/photos-api.ts`)

- **Role**: Typed `fetch` helpers — `listPhotos`, `getFeaturedPhoto`, `getPhoto`, `buildStaticMapUrl`; reuse upload helpers from U3  
- **NFR**: no session cache; throw/`PhotoApiError` on failure; trailing-slash list path if required  

## HomePhotosIsland

- **Role**: Homepage featured + recent  
- **Flow**: parallel featured + list → exclude featured from recent → links `/photos/<id>`  
- **NFR**: loading / Retry / empty states  

## PhotosGridIsland

- **Role**: `/photos` grid with Load more (cursor, limit 12)  
- **NFR**: empty-state pre-migration; card visual parity  

## PhotoDetailIsland

- **Role**: `/photos/[id]` — image, title, caption, tags, EXIF, optional map, Edit stub  
- **NFR**: 404 UI; placeholder static export params; weak SEO OK  

## PhotoStaticMap

- **Role**: Build OSM/staticmap URL; render `<img>`; hide on error  
- **NFR**: public coords only; no API key  

## SearchPhotoAugmentor (in `SearchBar`)

- **Role**: On open, bounded prefetch of photos; merge filtered hits with `posts.json` results  
- **NFR**: ~100 cap; photo href `/photos/<id>`  

## RedirectLayer (CloudFront)

- **Role**: In existing `StaticHTMLRoutingFunction`, if URI is `/posts/<digits>` → **301** `/photos/<digits>` **before** legacy date/slug redirects and `.html` rewrite  
- **NFR**: non-numeric `/posts/<slug>` unchanged; blog routes safe  

## StaticExportDetailShell

- **Role**: `app/photos/[id]/page.tsx` (+ `generateStaticParams` placeholder) hosting PhotoDetailIsland  
- **NFR**: works with `output: "export"`  

---

## Explicitly not in U4 logical set

| Component | Reason |
|-----------|--------|
| PhotoReactContext / SWR cache | Q6=A / NFR no session cache |
| Dedicated CF Function | Q5=A — merge into existing |
| MarkdownPhotoFallback | FD Q2=A API-only |
| PhotoSearchApi (backend `?q=`) | NFR Q2=A client filter |
| AuthEditController | U5 |

---

## Component → NFR map

| Component | Key NFRs |
|-----------|----------|
| PhotosApiClient | P2–P4, SEC1 |
| HomePhotosIsland | P1, P4, U1, R1 |
| PhotosGridIsland | P2, U2, COMPAT1 |
| PhotoDetailIsland | SEO1–2, R3, SEC3 |
| PhotoStaticMap | R2, SEC1–2 |
| SearchPhotoAugmentor | S2, P3 |
| RedirectLayer | COMPAT2, R4 |
