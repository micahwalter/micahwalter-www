# Application Design — Issues #103 / #104 (Consolidated)

**Branch**: `cursor/photo-metadata-dynamodb-be02`  
**Artifacts**: [components](./components.md) · [methods](./component-methods.md) · [services](./services.md) · [dependencies](./component-dependency.md)

---

## Design Summary

Migrate photo (and gallery) metadata to DynamoDB behind an extended `api.micahwalter.com/photos` API on the existing photo-upload stack (Node.js). Uploads persist quickly, then enrich asynchronously (Bedrock tags + AWS Location reverse geocode). The static Next.js site loads photo data via `lib/photos-api.ts`. Owner admin lives primarily under `/upload`, with an Edit shortcut on `/photos/[id]`. Public URLs move to `/photos/<id>` with legacy redirects. Feeds update via a scheduled job.

## Locked Decisions

| Topic | Choice |
|-------|--------|
| API / stack | Extend `micahwalter-photo-upload` |
| Language | Node.js |
| Enrichment | Async queue after pending persist |
| Frontend | `lib/photos-api.ts` + client fetch |
| Admin UX | `/upload` hub primary; detail Edit shortcut; galleries on hub |
| Geocode | AWS Location Service (cache on photo) |
| Static map | Provider deferred (port in design) |
| Components | Proposed set accepted |

## Component Map

```text
                    +------------------+
                    |   PhotosCLI      |
                    +--------+---------+
                             |
+-------------+   HTTPS    +--v------------------+   SDK   +----------------+
| PhotoAdminUI| ---------> | Photo Metadata API  | -------> | PhotoRepository|
| PhotoPublicUI|           | (Gateway + Lambdas) | -------> | GalleryRepository|
+------+------+            +----+-----+----+-----+         +----------------+
       |                        |     |    |
  lib/photos-api                |     |    +--> EnrichmentService --> Bedrock
                                |     |                           --> AWS Location
                         Process|     |Query/Command
                                v     v
                         S3 uploads / images CDN
                                |
                         FeedPublisher (schedule)
                                |
                         RedirectLayer (CloudFront)
```

## Services (orchestration)

1. **Photo Metadata API** — auth, CRUD photos/galleries, public reads  
2. **Upload & Process** — S3 → optimize → id → pending record → enqueue  
3. **Enrichment** — GPS fuzz, Location city/country tags, Bedrock tags  
4. **Public / Admin UI** — Next.js + photos-api helpers  
5. **Feed Publisher** — scheduled RSS/sitemap photo updates  
6. **CLI** — import/tag via API  

## Coverage vs Requirements / Stories

| Area | Design coverage |
|------|-----------------|
| FR-1–3 Store/API | PhotoRepository, Command/Query services |
| FR-2 Enrichment | EnrichmentService + async pipeline |
| FR-4–6 UI upload/browse | PhotoAdminUI, PhotoPublicUI |
| FR-5 Redirects | RedirectLayer |
| FR-7 Edit | PhotoCommandService + AdminUI shortcut |
| FR-8 Galleries | Gallery* components + hub admin |
| FR-9 Feeds/search | FeedPublisher + PhotoQueryService search |
| FR-10 CLI | PhotosCLI |
| FR-11 Cutover | Process drops GitHub commit; migration in Units/Construction |
| US-001–016 | Mapped across services above |

## Out of Scope Here

- DynamoDB key/GSI details, fuzz radius, map tile provider → Functional / NFR / Infrastructure Design  
- Exact HTTP path list and OpenAPI → Units / Code Generation  
- Dual-write duration and migration runbook → Units / Cutover unit  

## Next Stage

**Units Generation** — decompose into implementable units along the execution-plan critical path.
