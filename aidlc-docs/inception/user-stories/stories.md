# User Stories — Photo UX Polish

**Approach**: Feature-Based · **Format**: As a / I want / So that · **AC**: Given / When / Then  
**Coverage**: FR-1 … FR-5

---

## US-1 — Photo detail map and place label
**Persona**: Visitor (primary), Owner (verify after upload)  
**Traces**: FR-1, NFR-3, NFR-4

**As a** Visitor  
**I want** to see where a photo was taken on a map, plus a readable place name  
**So that** I can understand the location without relying only on tags

### Acceptance criteria
- **Given** a photo with `publicLatitude` and `publicLongitude`  
  **When** I open its detail page  
  **Then** an in-page OpenStreetMap-based map is visible (no API key / no dead staticmap host)

- **Given** a photo with `city` and/or `country`  
  **When** I view the detail page (map success or failure)  
  **Then** a place label showing available city/country is still visible

- **Given** the map is shown  
  **When** I use the map’s external link  
  **Then** I open OpenStreetMap centered on the public (fuzzed) coordinates

- **Given** only precise GPS exists server-side  
  **When** the public page renders  
  **Then** only public/fuzzed coordinates are used in the UI

---

## US-2 — Clickable tags to filtered photos
**Persona**: Visitor  
**Traces**: FR-2, NFR-2

**As a** Visitor  
**I want** to click a tag on a photo detail page  
**So that** I can see other photos that share that tag

### Acceptance criteria
- **Given** a photo detail with one or more tags  
  **When** I click a tag  
  **Then** I navigate to `/photos?tag=<urlencoded-tag>`

- **Given** `/photos?tag=port-washington` (example)  
  **When** the photos index loads  
  **Then** only DynamoDB photos whose tags match that tag (case-insensitive) are listed

- **Given** a tag that matches no photos  
  **When** I open `/photos?tag=…`  
  **Then** I see an empty filtered state (not an error page)

- **Given** blog `/tags/[tag]` pages  
  **When** this engagement ships  
  **Then** their behavior is unchanged (photo detail does not link there)

---

## US-3 — Homepage featured loading skeleton
**Persona**: Visitor  
**Traces**: FR-3, NFR-4, NFR-2

**As a** Visitor  
**I want** a calm visual placeholder while the featured photo loads  
**So that** the homepage does not flash a text-only “Loading photos…” message

### Acceptance criteria
- **Given** I land on the homepage before the photos API responds  
  **When** the page is in loading state  
  **Then** I see a skeleton / reserved aspect-ratio placeholder (not primary text “Loading photos…”)

- **Given** the API returns featured + recent photos  
  **When** loading completes  
  **Then** the featured image and recent mosaic appear without a large layout jump (space was reserved)

- **Given** the photos API fails  
  **When** loading errors  
  **Then** I still have a retry control

- **Given** this engagement’s decisions  
  **When** implemented  
  **Then** featured data remains client-fetched (no build-time bake)

---

## US-4 — Gallery detail layout within site container
**Persona**: Visitor  
**Traces**: FR-4, NFR-2

**As a** Visitor  
**I want** gallery thumbnails aligned with the site’s normal page margins  
**So that** the gallery does not feel broken or edge-to-edge on wide screens

### Acceptance criteria
- **Given** a gallery detail page with photos  
  **When** I view the thumbnail grid  
  **Then** the grid sits inside `max-w-wide mx-auto px-6` (or equivalent matching `/photos`)

- **Given** the gallery detail header  
  **When** I view the page  
  **Then** header spacing is consistent with other listing/detail headers on the site

- **Given** I open a photo in the lightbox  
  **When** the lightbox is active  
  **Then** it remains full-viewport / full-bleed

---

## US-5 — Bare `/photos` API list path
**Persona**: Owner (API consumers / site clients)  
**Traces**: FR-5

**As an** Owner  
**I want** `GET /photos` (no trailing slash) to list photos like `GET /photos/`  
**So that** clients are not broken by path slash quirks

### Acceptance criteria
- **Given** the photos HTTP API  
  **When** a client calls `GET /photos` without a trailing slash  
  **Then** the response is a successful list equivalent to `GET /photos/`

- **Given** browser CORS preflight to photo routes  
  **When** `OPTIONS` is issued  
  **Then** preflight succeeds (**204**) and no `$default` route is reintroduced

---

## Traceability matrix

| FR | Story |
|----|-------|
| FR-1 | US-1 |
| FR-2 | US-2 |
| FR-3 | US-3 |
| FR-4 | US-4 |
| FR-5 | US-5 |
