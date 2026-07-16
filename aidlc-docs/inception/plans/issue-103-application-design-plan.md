# Issue #103 / #104 — Application Design Plan

**Purpose**: Identify components, service orchestration, methods, and dependencies for the photo metadata migration.  
**Requirements**: `aidlc-docs/inception/requirements/issue-103-requirements.md`  
**Stories**: `aidlc-docs/inception/user-stories/issue-103-stories.md`  
**Execution plan**: `aidlc-docs/inception/plans/issue-103-execution-plan.md`

Please answer every `[Answer]:` below. After validation (and any clarifications), you will **approve this plan**, then design artifacts will be generated under `aidlc-docs/inception/application-design/`.

---



## Design questions



### Question 1 — Where does the photo/gallery API live?

A) **Extend existing photo-upload stack** — Add DynamoDB + read/write/gallery routes on `api.micahwalter.com/photos` (and `/photos/galleries` or similar) in `micahwalter-photo-upload`

B) **New sibling stack** — e.g. `micahwalter-photos` for metadata/read APIs; keep upload auth/init/process in the current stack but have process call the new data plane

C) **Split by concern** — Upload stack owns writes/enrichment; new read-optimized stack owns public GET + feed job

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



### Question 2 — Lambda language for new photo metadata APIs

A) **Node.js** — Match existing `infra/photo-upload-lambdas/` (faster reuse of process/exif code)

B) **Go** — Match newsletter/tickets stacks (`infra/newsletter-lambdas/`, ticket server)

C) **Hybrid** — Keep process/enrichment in Node; implement new public read + admin APIs in Go

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



### Question 3 — Enrichment execution model

A) **Inline in process Lambda** — After optimize + PutItem, call Bedrock + reverse-geocode in the same invocation (simpler; longer timeout)

B) **Async follow-up** — Process writes a `pending` record quickly; SQS/EventBridge triggers an enricher Lambda for tags/geo (better upload latency)

C) **Inline tags, async geo** — Bedrock in process; reverse-geocode async (or vice versa)

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---



### Question 4 — Frontend data access pattern

A) **Client-side fetch only** — Browser calls `api.micahwalter.com` from homepage/`/photos`/`/photos/[id]` (static shells)

B) **Thin BFF helpers** — Small client modules in `lib/photos-api.ts` wrapping fetch; pages are client components or hydrate from client

C) **Build-time fallback + client refresh** — Optional static placeholder; always refresh from API on load

X) Other (please describe after [Answer]: tag below)

[Answer]: Need more info on what this is

**Clarified → B** — Shared `lib/photos-api.ts` helpers (see clarifications file)

---



### Question 5 — Admin UI placement (edit + gallery admin)

A) **Under** `/upload` **hub** — Expand upload area into an authenticated “Photos admin” (upload | edit | galleries)

B) **Separate** `/admin/photos` **routes** — Dedicated admin section (`noindex`); upload stays at `/upload`

C) **Per-photo edit on detail page** — Owner sees edit controls on `/photos/[id]` when authed; galleries at `/admin/galleries`

X) Other (please describe after [Answer]: tag below)

[Answer]: A + C

**Clarified → Hub primary + detail shortcut** — Full admin under `/upload` hub; `/photos/[id]` has authenticated Edit shortcut for that photo; galleries only on hub

---



### Question 6 — Reverse geocode provider

A) **OpenStreetMap Nominatim** (or similar free HTTP API) with caching/rate limits

B) **AWS Location Service**

C) **Decide in Infrastructure Design** — Application Design only requires a `Geocoder` port/interface

X) Other (please describe after [Answer]: tag below)

[Answer]: B - but let me know the costs

**Clarified → A (stay with AWS Location Service)** — low volume; cost negligible; cache city/country on photo record

---



### Question 7 — Static map provider

A) **Static OSM/tile URL pattern** (e.g. staticmap or similar open service)

B) **Mapbox Static Images API** (token in env)

C) **Decide in Infrastructure / NFR Design** — Design only requires a `StaticMap` URL builder port

X) Other (please describe after [Answer]: tag below)

[Answer]: C

---



### Question 8 — Component boundary preference

A) **Proposed defaults below** — Accept the component list in “Proposed component set” (adjust later only if needed)

B) **Fewer, larger components** — Collapse read/write into one PhotosService; fewer files

C) **More granular** — Separate Enrichment, Geocoding, Tagging, FeedPublisher as first-class components in the design docs

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



## Proposed component set (for Question 8 / generation)


| Component             | Responsibility (high level)                                  |
| --------------------- | ------------------------------------------------------------ |
| PhotoRepository       | DynamoDB persistence for photos                              |
| GalleryRepository     | DynamoDB persistence for galleries                           |
| PhotoCommandService   | Create/update photo metadata; auth writes                    |
| PhotoQueryService     | List/get/featured/search public reads                        |
| GalleryAdminService   | Create/update gallery membership                             |
| GalleryQueryService   | Public gallery reads                                         |
| UploadProcessPipeline | S3 event → optimize → id → persist (orchestrates enrichment) |
| EnrichmentService     | EXIF/GPS, fuzz, reverse-geocode tags, Bedrock tags           |
| PhotoAdminUI          | Upload multi-file, edit, gallery admin (Next.js)             |
| PhotoPublicUI         | Homepage/`/photos`/`/photos/[id]`/search/galleries (Next.js) |
| RedirectLayer         | Legacy `/posts/<id>` → `/photos/<id>`                        |
| FeedPublisher         | Scheduled RSS/sitemap photo updates                          |
| PhotosCLI             | Import/tag against API                                       |


---

## Decisions locked (after clarifications)

| Topic | Decision |
|-------|----------|
| API home | Extend `micahwalter-photo-upload` / `api.micahwalter.com/photos` |
| Language | Node.js |
| Enrichment | Async (SQS/EventBridge enricher after fast persist) |
| Frontend access | `lib/photos-api.ts` thin helpers + client fetch |
| Admin UI | `/upload` hub primary; `/photos/[id]` Edit shortcut when authed; galleries on hub only |
| Reverse geocode | AWS Location Service (cache results on photo) |
| Static map | Port only in App Design; provider in Infra/NFR Design |
| Components | Proposed component set accepted |

---

## Generation checklist (after plan approval)

- [x] Generate `aidlc-docs/inception/application-design/components.md`
- [x] Generate `aidlc-docs/inception/application-design/component-methods.md`
- [x] Generate `aidlc-docs/inception/application-design/services.md`
- [x] Generate `aidlc-docs/inception/application-design/component-dependency.md`
- [x] Generate `aidlc-docs/inception/application-design/application-design.md` (consolidated)
- [x] Validate design completeness vs FR/US coverage
- [x] Update `aidlc-state.md` and `audit.md`

---

When all answers are filled, reply in chat.