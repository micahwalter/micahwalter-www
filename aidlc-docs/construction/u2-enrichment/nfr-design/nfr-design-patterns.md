# U2 — NFR Design Patterns

**Decisions**: Q1–Q7 = A

---

## Resilience

### Platform retries + EventBridge archive
- EventBridge rule invokes Enrichment Lambda directly.
- Rely on **Lambda async retry defaults** for transient failures.
- Enable **archive on `photo-bus`** for replay/recovery (NFR: no enricher SQS DLQ).
- If status is already `complete` → no-op (FD idempotency).

### Sequential best-effort steps
- Order: GPS extract → reverse geocode → Bedrock tags → **single** DynamoDB update.
- Each step uses try/catch; failures log and continue; no rollback of sibling steps.
- Hard failure only when the final update cannot be written (status → `failed`).

## Scalability

### On-demand serverless
- Default Lambda concurrency; **no reserved concurrency** in U2.
- One `photoId` per invocation; personal traffic envelope.

## Performance

### Optimized-cover Bedrock path
- Download/buffer the **optimized cover** variant only for vision.
- Do not send originals to Bedrock.
- Cap reasonable in-memory image size in implementation; Location uses coords only.

## Security

### Least-privilege worker + DTO projection
- Enricher role: S3 read (images), DynamoDB get/update, Bedrock invoke, Location search.
- Enricher is **not** an HTTP handler.
- **PublicDtoProjector** omits precise `latitude`/`longitude`.
- Logs: `photoId`, step flags (`hasGps`, step ok/fail) — avoid raw precise coordinates.

## Cross-cutting

| Pattern | Applied |
|---------|---------|
| Async handoff | EventBridge `PhotoPendingEnrichment` → worker |
| CQRS-lite | Worker writes; public reads via existing PhotoHttpApi + projector |
| Soft-fail providers | Bedrock/Location errors do not block photo visibility |
| Replay ops | EventBridge archive (not DLQ) |

## Explicitly not selected

| Pattern | Reason |
|---------|--------|
| Enricher SQS DLQ | NFR Q4=B / NFR Design Q1=A |
| Two-phase DDB writes | Q2=A |
| Reserved concurrency | Q3=A |
| Named EnrichmentStatusGate / FuzzCoordinator | Q6=A (logic lives in worker/helpers) |
