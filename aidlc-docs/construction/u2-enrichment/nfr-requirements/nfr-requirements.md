# U2 — NFR Requirements

**Unit**: Enrichment  
**Decisions from**: `u2-enrichment-nfr-requirements-plan.md`

---

## Scalability

| ID | Requirement |
|----|-------------|
| NFR-U2-S1 | Design for **personal volume**: tens of enrichments/day; default Lambda concurrency (no reserved concurrency cap). |
| NFR-U2-S2 | Accept Bedrock on-demand pricing at personal traffic; no daily Bedrock budget alarm in U2. |
| NFR-U2-S3 | Multi-region scale-out **out of scope for U2** (U7). |

## Performance / freshness

| ID | Requirement |
|----|-------------|
| NFR-U2-P1 | **Best effort** enrichment freshness — no hard SLO. Soft goal: most photos enriched within a few minutes of upload under normal load. |
| NFR-U2-P2 | Enrichment Lambda: **timeout 60s**, **memory 1024 MB** (S3 + Location + Bedrock on optimized cover). |
| NFR-U2-P3 | One invocation processes **one** `photoId` (geo + Bedrock as applicable). |

## Reliability

| ID | Requirement |
|----|-------------|
| NFR-U2-R1 | Soft-fail Bedrock and Location: persist partial results; set `complete` when the worker finishes an update; log provider errors (aligns with NFR-6 / FD). |
| NFR-U2-R2 | **No dedicated enricher SQS DLQ** in U2 — rely on EventBridge **archive/replay** for recovery; photo may remain `pending`/`failed` until replay or backfill. |
| NFR-U2-R3 | Idempotent no-op when `enrichmentStatus === complete` (FD BR-U2-04). |
| NFR-U2-R4 | Photo remains publicly readable regardless of enrichment status. |

## Availability

| ID | Requirement |
|----|-------------|
| NFR-U2-A1 | Deploy enricher in **us-east-1** only (primary), matching photo-upload / photos table. |
| NFR-U2-A2 | Bedrock model access and Location Place Index assumed available in us-east-1; document enablement in infra/README. |

## Security

| ID | Requirement |
|----|-------------|
| NFR-U2-SEC1 | Enricher IAM least-privilege: S3 read images, DynamoDB get/update photo, Bedrock invoke, Location search-only. |
| NFR-U2-SEC2 | No new public write endpoints in U2; PublicPhotoDTO additive only. |
| NFR-U2-SEC3 | Precise GPS never in public DTO; avoid logging precise coordinates (log presence/outcome, not raw lat/lon values as a practice). |
| NFR-U2-SEC4 | No new secrets beyond existing stack patterns; Bedrock/Location via IAM. |

## Observability

| ID | Requirement |
|----|-------------|
| NFR-U2-O1 | CloudWatch logs with `photoId`, step success/fail (gps/geo/bedrock), resulting `enrichmentStatus`. |
| NFR-U2-O2 | No new enricher CloudWatch alarm or custom metrics required in U2. |
| NFR-U2-O3 | Existing process-fn error alarm remains unchanged. |

## API / contract

| ID | Requirement |
|----|-------------|
| NFR-U2-API1 | **Additive** PublicPhotoDTO fields: `city`, `country`, populated `publicLatitude`/`publicLongitude`/`tags` when enrichment succeeds. |
| NFR-U2-API2 | No new HTTP routes in U2. |

## Maintainability

| ID | Requirement |
|----|-------------|
| NFR-U2-M1 | Ship enricher in the **existing** `photo-upload` Lambda zip and CloudFormation stack. |
| NFR-U2-M2 | Reuse photo-db helpers; keep Bedrock prompt aligned with `scripts/tag-photos.js`. |
