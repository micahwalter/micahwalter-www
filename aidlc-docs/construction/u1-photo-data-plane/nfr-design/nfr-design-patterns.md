# U1 — NFR Design Patterns

**Decisions**: Q1=C, Q2=A, Q3=A, Q4=A, Q5=A, Q6=A

---

## Resilience

### Fail-closed persist + DLQ for process
- Optimize or ticket failure → **no DynamoDB write** (functional BR-U1-13/14).
- Configure **process Lambda failure destination (DLQ)** so poison S3 events / repeated failures are inspectable (Q1=C).
- Rely on Lambda/S3 native retries before DLQ; no custom in-process retry loops beyond platform defaults.

### Best-effort enrichment enqueue
- After successful `PutItem`, publish to enrichment queue.
- If enqueue fails → **log and continue**; photo stays `enrichmentStatus=pending` for U2/manual redrive (Q2=A).
- Do not roll back the photo row on enqueue failure.

## Scalability

### On-demand serverless
- DynamoDB **on-demand** capacity mode.
- Lambda **default concurrency** (no reserved concurrency on process in U1) (Q3=A).
- Horizontal scale implicit via Lambda/API Gateway; personal traffic envelope from NFR-U1-S1.

## Performance

### GSI list/featured access
- Primary key: `id`.
- GSI for newest-first listing: partition suitable for “all public photos” (e.g. constant `gsi1pk=PHOTO`) + sort `publishedAt`/`id` (exact key schema in Infrastructure Design).
- Featured: query/filter newest `featured=true`, else newest overall — **no in-memory cache** component (Q4=A).
- Cursor pagination encoded from GSI keys (implementation detail; no separate CursorCodec component required in U1).

## Security

### Token verify + DTO projection + least privilege
- Shared **AuthVerifier** (`assertAuth`) on PATCH routes only (Q5=A).
- **PublicDtoProjector** strips precise GPS and internal-only fields.
- Each Lambda role: least privilege (DDB table/GSI, S3 paths, tickets invoke/HTTPS, queue send for process only).
- No extra API Gateway body-size limits mandated in U1 (can add later).

## Cross-cutting

| Pattern | Applied |
|---------|---------|
| CQRS-lite | Separate read DTOs vs command/process writes |
| Async handoff | Queue publisher after persist (consumer = U2) |
| Defense in depth | IAM (process) + HMAC (browser) + DTO filter |
