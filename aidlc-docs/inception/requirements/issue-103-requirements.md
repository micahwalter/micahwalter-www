# Issues #103 / #104 — Requirements

**Status**: Draft — pending approval  
**Branch**: `cursor/photo-metadata-dynamodb-be02`  
**Issues**: [#103](https://github.com/micahwalter/micahwalter-www/issues/103), [#104](https://github.com/micahwalter/micahwalter-www/issues/104)  
**Date**: 2026-07-16

---

## Intent Analysis

| Dimension | Assessment |
|-----------|------------|
| **User request** | Migrate photo metadata from YAML/markdown in `content/posts/` to a database; serve photos dynamically so publishes no longer require a full static deploy; add multi-upload, captions, geo/map, and automatic AI tags |
| **Request type** | Migration + enhancement (brownfield) |
| **Scope** | Cross-system — photo-upload Lambdas, new DynamoDB + APIs, Next.js photo UI, CloudFront redirects, CLI, galleries, feeds/search |
| **Complexity** | Complex |
| **Requirements depth** | Comprehensive |
| **Out of scope** | Moving blog/email posts off markdown; changing image CDN binary layout (keep existing keys initially); Security / Resiliency / PBT AI-DLC extensions |

---

## Decisions Locked

| Topic | Decision |
|-------|----------|
| Delivery scope | **Full cutover** this engagement |
| Hosting model | **Client/API fetch hybrid** — static site shells; photo surfaces load metadata from `api.micahwalter.com` at runtime |
| Public URLs | **`/photos/<id>`**; permanent redirects from legacy `/posts/<id>` for existing photo ids |
| Multi-upload | Per-file title, caption, featured (no batch defaults) |
| Caption model | **Single field** (`caption` / `description`) for detail page, cards, RSS, search |
| AI tags | Auto-apply via Bedrock in process pipeline; **editable** via authenticated edit UI |
| AI enrichment scope | **Tags only** (no auto title/caption) |
| Maps | **Static map image** when public geo present; hide when absent |
| Geo privacy | Store precise GPS; **round/fuzz** coordinates for public map display |
| City/country | **Reverse-geocode** when GPS exists; merge city + country into `tags` (with AI tags) |
| Feeds / search | Listings/search hit photo API live; **lightweight scheduled job** updates RSS/sitemap (not full site rebuild) |
| Galleries | Move to DynamoDB; **authenticated gallery admin UI** |
| Post-upload edit | Authenticated **web edit UI** (title, caption, tags, featured, location visibility as applicable) |
| Multi-region | **Parity with rest of site** (primary + secondary patterns consistent with existing stacks) |
| Extensions | Security Baseline **No**; Resiliency Baseline **No** (multi-region NFR still applies); PBT **No** |

---

## Functional Requirements

### FR-1 — Photo metadata store

1. Persist photo metadata in **DynamoDB** (not `content/posts/` markdown).
2. Primary key: numeric ticket-allocated `id` (same counter as today via `api.micahwalter.com/tickets`).
3. Attributes include at least: `title`, `caption`, `publishedAt`, `featured`, `tags[]`, EXIF fields (camera, lens, aperture, shutterSpeed, iso, focalLength, dateTaken), `latitude`/`longitude` (precise, internal), `publicLatitude`/`publicLongitude` (fuzzed) or equivalent derivation, `folderName` / image keys, `draft`, enrichment status timestamps.
4. One-time migration imports all existing ~43 photo `index.md` records (and GPS from S3 originals where available).

### FR-2 — Upload API & processing

1. Extend `api.micahwalter.com/photos` so process Lambda **writes DynamoDB** and **does not commit** photo markdown to GitHub.
2. Support **multi-file** upload from `/upload`: N parallel or batched presigned PUTs; each file is an independent photo record.
3. Accept per-file **title**, **caption**, and **featured** at upload time.
4. Extract EXIF including **GPS** when present.
5. When GPS present: reverse-geocode to city/country and **merge into tags**; store precise coords; derive fuzzed public coords for map.
6. Invoke **Bedrock Claude Vision** (same intent as `scripts/tag-photos.js`) to auto-apply 3–8 content tags; merge with author/geo tags; do not invent title/caption.
7. Optimize and store images on existing images bucket/CDN (unchanged key strategy initially).
8. Publish is complete when the DynamoDB record is writable/readable — **no site deploy required** for the photo to appear on API-backed surfaces.

### FR-3 — Public read API

1. Public (or cacheable) endpoints for: list photos (paginated), get photo by id, featured photo, and search/filter as needed by the frontend.
2. Public responses expose **fuzzed** coordinates (or omit precise GPS); never require leaking full precision to anonymous clients if fuzzing is applied server-side.
3. Authenticated write/update endpoints for photo metadata (used by edit UI and optionally CLI).

### FR-4 — Frontend: browse & detail

1. Homepage hero, Recent Photos, `/photos` grid, and photo detail load from the photo API (client-side or equivalent runtime fetch) — not from `getPhotos()` filesystem reads for production photo data.
2. Photo detail URL: **`/photos/<id>`**.
3. Detail page shows caption (single field), tags, EXIF, and a **static map image** when public geo exists; no map chrome when absent.
4. Blog posts remain static markdown under `/posts/<slug>`.

### FR-5 — URL migration

1. Add permanent redirects (CloudFront function and/or static redirect pages) from `/posts/<photo-id>` → `/photos/<photo-id>` for all migrated photo ids.
2. Update internal links (homepage, cards, galleries, search) to `/photos/<id>`.
3. giscus / comments: pathname mapping must remain correct for the new photo URLs (or documented migration note).

### FR-6 — Upload UI

1. `/upload` supports multi-file selection.
2. Per-file fields: title, caption, featured.
3. Per-file upload progress/status.
4. Passcode auth pattern retained (or evolved consistently with edit/gallery admin).

### FR-7 — Authenticated edit UI

1. Site owner can update title, caption, tags, featured (and location display-related fields as designed) without git.
2. Same auth family as upload (passcode → short-lived token) unless Application Design chooses a shared admin session.

### FR-8 — Galleries

1. Gallery definitions (name/slug, ordered photo ids, metadata) live in DynamoDB.
2. Authenticated **gallery admin UI** to create/rename galleries and add/remove/reorder photos.
3. Public gallery pages resolve photo metadata from the photo API/DB.
4. Migrate existing `content/galleries/*/index.md` into DynamoDB.

### FR-9 — Feeds, sitemap, search

1. In-site photo listings and search use the **live photo API**.
2. RSS and sitemap (photo URLs) updated by a **lightweight scheduled job** (not a full Next.js site rebuild).
3. Blog RSS/sitemap generation for markdown posts may remain in existing prebuild scripts.

### FR-10 — CLI parity

1. `blog photos:import` / tagging flows write to the API/DB (no photo markdown as source of truth).
2. `blog photos:tag` may remain for re-runs/backfill against DB-backed photos.
3. Gallery CLI optional; web admin is the required management path for v1.

### FR-11 — Content tree cleanup

1. After successful migration and cutover, remove photo folders from `content/posts/`.
2. `content/posts/` retains blog and email markdown only.
3. Remove or stop using GitHub-commit path in photo-upload process Lambda.

---

## Non-Functional Requirements

### NFR-1 — Publish latency

- A completed upload makes the photo visible on homepage / `/photos` / `/photos/<id>` **without** waiting for GitHub Actions site deploy.

### NFR-2 — Static blog unchanged

- Blog and email continue to use `output: "export"` and markdown; no requirement to SSR the whole site.

### NFR-3 — Multi-region parity

- Photo metadata store and APIs follow the site’s existing multi-region posture (primary us-east-1 with secondary patterns consistent with images/API stacks). Exact replication mechanism decided in Infrastructure Design.

### NFR-4 — Security (baseline practices without Security extension)

- Passcode + HMAC (or equivalent) for upload/edit/gallery admin.
- Public read API does not expose precise GPS.
- Secrets remain in Secrets Manager; no secrets in git.
- Bedrock invoke limited to process/enrichment role.

### NFR-5 — Image CDN

- Existing CloudFront `/images/*` behavior and object layout remain valid; no mandatory re-key of historical objects in v1.

### NFR-6 — Observability

- Process/enrichment failures (EXIF, Bedrock, reverse-geocode, DynamoDB) are logged; partial success allowed (e.g. photo live without tags/map if enrichment fails) with retry/backfill path.

### NFR-7 — Compatibility

- Existing photo ids remain stable.
- Legacy `/posts/<id>` photo URLs redirect permanently.

---

## User Scenarios (summary)

1. **Owner uploads many photos** from phone/browser with per-file title/caption/featured → each appears live with AI tags (+ city/country tags if GPS) and optional static map.
2. **Owner edits** a photo’s caption/tags/featured on the site without git or deploy.
3. **Owner manages galleries** via admin UI (create, reorder membership).
4. **Visitor** browses `/photos`, opens `/photos/<id>`, sees caption/tags/EXIF/map when available.
5. **Visitor** hits old `/posts/<id>` photo link → lands on `/photos/<id>`.
6. **Feeds** eventually include new photos via scheduled job without full site rebuild.

---

## Acceptance Criteria

- [ ] Uploading one or many photos does not create/update files under `content/posts/` for those photos.
- [ ] New photos appear on API-backed UI without a full site rebuild.
- [ ] `/upload` supports multi-file with per-file title, caption, featured + progress.
- [ ] Process pipeline auto-applies Bedrock tags; edit UI can change tags/title/caption/featured.
- [ ] When GPS exists: fuzzed static map on detail; city/country merged into tags; precise coords not exposed publicly.
- [ ] When GPS absent: no map UI.
- [ ] Public URLs are `/photos/<id>`; `/posts/<id>` redirects for former photo ids.
- [ ] Galleries managed via authenticated admin UI and served from DynamoDB.
- [ ] Existing ~43 photos migrated; photo markdown folders removable after cutover.
- [ ] Live listings/search via API; RSS/sitemap photo updates via scheduled job.
- [ ] Multi-region posture documented and implemented on par with peer stacks.

---

## Extension Configuration

| Extension | Enabled | Notes |
|-----------|---------|-------|
| Security Baseline | No | Still apply practical auth/secrets/GPS privacy in NFRs |
| Resiliency Baseline | No | Multi-region parity required as explicit NFR |
| Property-Based Testing | No | No test runner in repo; lightweight validation as designed |

---

## Traceability

| Source | Mapped requirements |
|--------|---------------------|
| Issue #103 | FR-1–5, FR-9–11, NFR-1–2, NFR-5, NFR-7 |
| Issue #104 multi-upload | FR-2, FR-6 |
| Issue #104 caption | FR-2, FR-4, FR-5 (single field), FR-7 |
| Issue #104 geo/map | FR-2, FR-4, NFR-4 |
| Issue #104 AI tags | FR-2, FR-7, NFR-6 |
| Clarification gallery UI | FR-8 |
| Clarification city/country tags | FR-2.5–2.6 |

---

## Open Items for Later Stages (not blocking requirements)

- Exact DynamoDB schema, GSI design, and API shapes → Application / Infrastructure Design
- Static map provider (e.g. static OSM/Mapbox URL pattern) → Functional / NFR Design
- Fuzz radius (e.g. ~100–500m) → NFR Design
- Reverse-geocode provider → Infrastructure Design
- Dual-write period length during cutover → Workflow / Construction plan
- Comment (giscus) pathname cutover checklist → Construction
