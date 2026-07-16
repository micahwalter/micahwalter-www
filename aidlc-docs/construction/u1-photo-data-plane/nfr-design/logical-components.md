# U1 — Logical Components

Minimal set (Q6=A). Infrastructure binding → Infrastructure Design.

---

## PhotoStore

- **Role**: Persistence port for Photo aggregate  
- **Ops**: put, update, getById, listByPublishedAt (cursor), getFeatured  
- **NFR**: on-demand DynamoDB; GSI for list sort  

## PhotoHttpApi

- **Role**: HTTP boundary for public GET + authenticated PATCH  
- **Depends on**: PhotoStore, AuthVerifier, PublicDtoProjector  
- **NFR**: no response CDN cache; CORS as today  

## ProcessWorker

- **Role**: S3 ObjectCreated handler — optimize → ticket → put → enqueue  
- **Depends on**: ImageOptimizer, TicketClient, PhotoStore, EnrichmentQueuePublisher  
- **NFR**: fail-closed on optimize/ticket; **DLQ** on repeated failure; IAM only  

## TicketClient

- **Role**: Allocate numeric photo id via tickets API  
- **NFR**: network errors fail process (no DDB row)  

## ImageOptimizer

- **Role**: Produce CDN variants + original key refs  
- **NFR**: failure fails process before persist  

## EnrichmentQueuePublisher

- **Role**: Send `{ photoId }` (or equivalent) after successful put  
- **NFR**: best-effort; log on failure; does not delete photo  

## AuthVerifier

- **Role**: Validate HMAC token for PATCH  
- **NFR**: reject invalid/expired; unused by ProcessWorker  

## PublicDtoProjector

- **Role**: Map Photo → PublicPhotoDTO  
- **NFR**: never emit precise latitude/longitude  

---

## Explicitly not in U1 logical set

| Component | Reason |
|-----------|--------|
| IdempotencyGuard | Not selected (Q6=A); Lambda/S3 retry + DLQ instead |
| CursorCodec (named) | Cursor encoding lives inside PhotoStore/PhotoHttpApi |
| In-memory featured cache | Not selected (Q4=A) |
| Enrichment consumer | U2 |

## Component collaboration

```text
S3 event -> ProcessWorker
             |-> ImageOptimizer
             |-> TicketClient
             |-> PhotoStore.put
             |-> EnrichmentQueuePublisher (best effort)
             +-> DLQ on terminal failure

Client GET  -> PhotoHttpApi -> PhotoStore -> PublicDtoProjector
Client PATCH -> PhotoHttpApi -> AuthVerifier -> PhotoStore
```
