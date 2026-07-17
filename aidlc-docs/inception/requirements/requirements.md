# Requirements — Photo UX Polish

## Intent Analysis

| Field | Value |
|-------|-------|
| **User request** | Post-cutover feedback: map missing on photo detail, tags not clickable, homepage featured loading text, galleries layout bleed |
| **Request type** | Enhancement + bug fix |
| **Scope** | Multiple front-end components; light photos API change for tag filter and bare `/photos` path |
| **Complexity** | Simple–moderate |
| **Depth** | Standard |

## Decisions (from clarifying questions)

| # | Topic | Decision |
|---|--------|----------|
| 1 | Map | In-page OSM embed / lightweight tile map (no API key); always show place label even if map fails |
| 2 | Tags | Photo tags link to `/photos?tag=<tag>` (DynamoDB photos only) |
| 3 | Homepage | Keep client fetch; replace text loader with skeleton / reserved aspect-ratio placeholder |
| 4 | Galleries | Standard `max-w-wide mx-auto px-6` on detail grid; also tighten detail header/spacing; lightbox stays full-bleed |
| 5 | Scope extras | Include place text when no map (covered by Q1) **and** fix bare `GET /photos` (no trailing slash) API routing |
| 6–8 | Extensions | Security **No**, Resiliency **No**, PBT **No** |

## Functional Requirements

### FR-1 — Photo detail map
- Replace `staticmap.openstreetmap.de` static image with an in-page OpenStreetMap-based map (embed or lightweight tiles) that needs no API key.
- When `publicLatitude` / `publicLongitude` exist, show the map.
- Always show a place label (`city`, `country`) when available, even if the map fails to load.
- Preserve link-out to OpenStreetMap for the (fuzzed) public coordinates.
- Do not expose precise `latitude` / `longitude` in the public UI (continue using public/fuzzed fields only).

### FR-2 — Clickable photo tags
- On API photo detail, each tag is a link to `/photos?tag=<urlencoded-tag>`.
- `/photos` honors `?tag=` and shows only matching DynamoDB photos (case-insensitive tag match).
- Empty / unknown tag yields an empty (or clearly empty) filtered list, not an error page.
- Blog/MDX `/tags/[tag]` behavior is unchanged in this engagement (photo pages do not link there).

### FR-3 — Homepage featured loading UX
- Remove the plain “Loading photos…” text as the primary loading affordance.
- While featured/recent photos are fetching, show a skeleton or reserved aspect-ratio placeholder consistent with the site design (cream/charcoal, no card clutter in the hero sense — match existing homepage composition).
- Keep client-side API fetch (no build-time bake in this engagement).
- On error, keep a retry control.

### FR-4 — Galleries layout
- Wrap gallery detail photo grid in `max-w-wide mx-auto px-6` (and matching vertical padding), aligned with `/photos` and galleries index.
- Tighten gallery detail header / spacing for consistency with other listing/detail headers.
- Lightbox remains full-viewport / full-bleed.

### FR-5 — Bare `/photos` API path
- `GET https://api.micahwalter.com/photos` (no trailing slash) must succeed for list (same behavior as `GET /photos/`), without breaking CORS preflight (do **not** reintroduce HTTP API `$default` route).
- Preferred approach: add an explicit list route that matches the bare path, or equivalent API Gateway path mapping that does not intercept `OPTIONS`.

## Non-Functional Requirements

### NFR-1 — Static export compatibility
- Solutions must work with Next.js `output: "export"` (client components / build-time params as today). No reliance on ISR or server routes.

### NFR-2 — Design system
- Preserve existing tokens: cream/charcoal/gray/accent, `max-w-wide` / `max-w-reading`, EB Garamond serif.
- Tag chip styling should match existing clickable tag patterns (`hover:border-gray hover:bg-gray/10`).

### NFR-3 — Privacy
- Maps and place UI use only public/fuzzed coordinates and city/country already exposed by the photos API DTO.

### NFR-4 — Performance / perceived load
- Homepage skeleton should reserve space to avoid large layout shift when the featured image appears.
- Map should not block the rest of the photo detail page from rendering.

## Out of Scope
- Build-time baking of featured photo into static HTML (rejected in Q3).
- Merging DynamoDB photos into `/tags/[tag]` (rejected in Q2).
- Security / resiliency / PBT extension enforcement.
- Re-enriching historical photos that lack GPS.

## Success Criteria
- Photo `171` (or any photo with public coords) shows a visible map + Port Washington, USA (or equivalent place label).
- Clicking a tag on a photo detail navigates to a filtered `/photos?tag=…` list of matching photos.
- Homepage no longer flashes a text-only “Loading photos…” as the main loading state; a skeleton/placeholder appears instead.
- Gallery detail thumbnails sit inside the standard wide container (not edge-to-edge).
- Bare `GET /photos` list returns 200 with CORS intact for browser origins.

## Suggested follow-on (not this engagement)
- Optional: API `tag` query param server-side if client-side filtering of paged lists proves insufficient for large libraries.
