# U4 — Frontend Components

**Preserve** existing site design system (serif, cream/charcoal, photo grid language). Prefer client islands over rewriting entire layouts.

---

## `lib/photos-api.ts` (extend)

Add public read helpers (no React hooks):

| Export | Behavior |
|--------|----------|
| `PublicPhoto` type | Align with API DTO (id, title, caption, tags, exif, public lat/lon, image URLs, featured, publishedAt, …) |
| `listPhotos({ limit?, cursor? })` | `GET /` or `GET /photos/` with query; return `{ items, cursor }` |
| `getFeaturedPhoto()` | `GET /featured` → photo or null |
| `getPhoto(id)` | `GET /{id}` → photo; throw/`PhotoApiError` on 404 |
| `buildStaticMapUrl(lat, lon, opts?)` | OSM/staticmap-style URL from public coords |
| Existing upload helpers | Unchanged (`authWithPasscode`, `getUploadUrl`, …) |

Base URL: `NEXT_PUBLIC_PHOTO_API_URL` (trailing slash normalized). Prefer trailing-slash list path if required by API Gateway quirk.

---

## Homepage photo sections (`app/page.tsx` + small client children)

**Responsibility**: Replace `getFeaturedPhoto()` / `getPhotos()` markdown calls for photo hero + recent strip.

| Piece | Notes |
|-------|--------|
| `HomeFeaturedPhoto` (client) | Fetches featured; renders current hero visual pattern |
| `HomeRecentPhotos` (client) | Fetches list; excludes featured id; links to `/photos/<id>` |
| Blog recent | Remains static markdown |

Loading/error/empty states for photo blocks only.

---

## Photos index (`app/photos/page.tsx`)

Shell may stay server; grid becomes client:

| Component | Responsibility |
|-----------|----------------|
| `PhotosGrid` (client) | `listPhotos` limit 12; Load more via cursor; card UI comparable to `PaginatedPostGrid` / photo cards |
| Empty state | Copy when API returns zero items (pre-U7 migration) |

Links: `/photos/<id>` (not `/posts/<id>`).

---

## Photo detail (`app/photos/[id]/page.tsx` + layout)

New route (static export needs a client-driven detail or placeholder `generateStaticParams` strategy — resolve in Code Gen / NFR; runtime fetch of id is required).

| Component | Responsibility |
|-----------|----------------|
| `PhotoDetail` (client) | Load by id; title, image, caption, tags, date, EXIF |
| `PhotoStaticMap` | Renders `<img>` from `buildStaticMapUrl` when public geo present; omit otherwise |
| `PhotoEditShortcut` | U5 stub — optional/hidden until auth; points toward hub editor |

Reuse visual patterns from `PhotoLayout` where practical (without “Edit on GitHub” for DB photos).

---

## Search (`components/SearchBar.tsx`)

| Change | Behavior |
|--------|----------|
| Keep | Existing `posts.json` / markdown post search |
| Add | On query, also fetch photo list (or cached page) and filter title/caption/tags client-side (no dedicated search API in U1) |
| Results | Photo hits show with type affordance; `href=/photos/<id>` |
| Debounce | Avoid hammering API on every keystroke (NFR will set limits) |

---

## RedirectLayer (infra, not Next page)

CloudFront Function: `/posts/<digits>` → 301 `/photos/<digits>`. Documented in U4 Infrastructure Design; no static redirect HTML pages in U4 (Q4=A).

---

## Component → API map

| UI | Endpoints |
|----|-----------|
| Home featured | `GET …/featured` |
| Home recent / Photos grid / Search photos | `GET …/` (+ cursor) |
| Detail | `GET …/{id}` |
| Map | External OSM static image URL (no photo API) |
| Edit stub | None in U4 |
