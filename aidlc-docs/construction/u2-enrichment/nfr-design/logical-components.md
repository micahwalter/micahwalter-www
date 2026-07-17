# U2 — Logical Components

Minimal set (Q6=A). Infrastructure binding → Infrastructure Design.

---

## EnrichmentWorker

- **Role**: EventBridge consumer for `PhotoPendingEnrichment`  
- **Flow**: load photo → skip if `complete` → run steps → merge → update store → set status  
- **NFR**: 60s / 1024 MB; async retries; archive replay  

## PhotoStore (reuse U1)

- **Role**: getById + update enrichment fields (`latitude`, `longitude`, `public*`, `city`, `country`, `tags`, `enrichmentStatus`, `updatedAt`)  
- **NFR**: on-demand DynamoDB; least-privilege update  

## ImageObjectReader

- **Role**: Fetch S3 objects — original for GPS; optimized cover for Bedrock  
- **NFR**: images-bucket read only  

## GpsExtractor

- **Role**: Parse EXIF GPS from original bytes → precise lat/lon or none  
- **NFR**: enricher-owned GPS (FD Q1=A)  

## PlaceReverseGeocoder

- **Role**: AWS Location reverse geocode → city (or region substitute) + country + tag forms  
- **NFR**: soft-fail; us-east-1  

## BedrockTagger

- **Role**: Vision Converse with CLI-parity prompt/model → 3–8 tags  
- **Input**: optimized cover bytes only  
- **NFR**: soft-fail; model `us.anthropic.claude-sonnet-4-6`  

## TagMerger

- **Role**: Union-merge existing + geo + AI tags; case-normalize; de-dupe  
- **NFR**: never remove prior tags; never touch title/caption  

## PublicDtoProjector (extend U1)

- **Role**: Map Photo → PublicPhotoDTO  
- **U2 change**: expose `city`, `country`, `publicLatitude`, `publicLongitude`, enriched `tags`; still omit precise GPS (Q7=A)  

## EventBridgeArchive (ops)

- **Role**: Retention/replay of `photo-bus` events for recovery  
- **NFR**: replaces enricher DLQ requirement in U2  

---

## Explicitly not in U2 logical set

| Component | Reason |
|-----------|--------|
| EnrichmentStatusGate (named) | Gate logic inside EnrichmentWorker (Q6=A) |
| FuzzCoordinator (named) | Rounding helper inside worker/geo path (Q6=A) |
| Enricher SQS queue/DLQ | Not selected |
| HTTP API routes | No new endpoints (NFR-U2-API2) |

## Component collaboration

```text
EventBridge PhotoPendingEnrichment
  -> EnrichmentWorker
       |-> PhotoStore.getById
       |-> (if complete: stop)
       |-> ImageObjectReader (original) -> GpsExtractor
       |-> PlaceReverseGeocoder (if GPS)
       |-> ImageObjectReader (cover) -> BedrockTagger
       |-> TagMerger
       +-> PhotoStore.update (+ status)

Client GET -> PhotoHttpApi -> PhotoStore -> PublicDtoProjector
```
