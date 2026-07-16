# Component Dependencies — Issues #103 / #104

---

## Dependency Matrix

| Component | Depends on |
|-----------|------------|
| PhotoCommandService | PhotoRepository, Auth/token lib, Tickets (create path via process) |
| PhotoQueryService | PhotoRepository |
| GalleryAdminService | GalleryRepository, Auth |
| GalleryQueryService | GalleryRepository, PhotoRepository (or PhotoQueryService for summaries) |
| UploadProcessPipeline | S3, optimize lib, Tickets API, PhotoRepository / PhotoCommandService, Enrichment queue |
| EnrichmentService | PhotoRepository, S3/images, Bedrock, AWS Location |
| PhotoAdminUI | `lib/photos-api.ts` → Command/Query/Gallery APIs, Auth |
| PhotoPublicUI | `lib/photos-api.ts` → Query/Gallery APIs |
| RedirectLayer | Photo id set (migrated ids / numeric heuristic + allowlist) |
| FeedPublisher | PhotoQueryService or PhotoRepository |
| PhotosCLI | Photo APIs (auth) |

---

## Communication Patterns

| From → To | Pattern |
|-----------|---------|
| Browser → API Gateway | HTTPS JSON (CORS for www + localhost) |
| Init → S3 | Presigned PUT |
| S3 → Process | Event notification |
| Process → Enrichment | Async queue (SQS preferred) |
| Process/Enrichment → DynamoDB | AWS SDK |
| Enrichment → Bedrock / Location | AWS SDK |
| Process → Tickets | HTTPS |
| FeedPublisher → S3 website/artifacts | SDK put |
| CF → RedirectLayer | CloudFront Function / behavior |

---

## Data Flow (upload → public)

```text
Owner (AdminUI)
  -> auth + upload-url (title, caption, featured)
  -> S3 PUT original
  -> Process: optimize + id + DynamoDB pending + enqueue
  -> Enrichment: GPS fuzz + Location city/country tags + Bedrock tags
  -> DynamoDB complete
Visitor (PublicUI)
  -> lib/photos-api get/list/featured
  -> PhotoQueryService (fuzzed DTO)
  -> render /photos/[id] (+ static map if public geo)
```

---

## Data Flow (legacy URL)

```text
Visitor -> GET /posts/156
  -> RedirectLayer 301 -> /photos/156
  -> PhotoPublicUI -> API getPhoto(156)
```

---

## Coupling notes

- **Tight**: Process ↔ Repository; Enrichment ↔ Repository; UI ↔ photos-api helpers
- **Loose**: FeedPublisher (schedule); RedirectLayer (edge); CLI (same HTTP contracts)
- **External**: Tickets, Bedrock, AWS Location, S3 images CDN (unchanged layout initially)
