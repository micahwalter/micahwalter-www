# U7 — NFR Design Patterns

**Decisions**: Derived from U7 NFR Requirements + tickets/images secondary posture (no re-ask)

---

## Resilience

### Idempotent cutover + verify gate
- PhotoMigrator upserts by stable `id`; dry-run default; failed rows re-runnable.
- ContentCleanup runs only after public API verify of migrated ids.
- No dual-write; no markdown photo fallback on public surfaces.
- Process path remains fail-closed for persist (U1); remove residual GitHub-commit path.

### Soft-fail feed publish
- FeedPublisher failures log + exit non-zero for observability; **do not** block site deploys.
- Next EventBridge schedule retries; blog prebuild RSS/sitemap remains authoritative for markdown posts.
- Partial page writes avoided: write temp → replace artifact (Infra detail).

### Secondary compute failover (tickets-style)
- us-east-2 PhotoUploadSecondary serves API when Route53/API domain failover directs traffic.
- Data plane stays **primary DynamoDB** (cross-region from secondary Lambdas).
- Images continue CloudFront origin-group failover (existing S3 CRR) — unchanged by U7.

## Scalability

### On-demand serverless
- Photos + galleries tables remain **on-demand**.
- Feed Lambda + secondary API Lambdas: **default concurrency**.
- Migration is one-shot ~44 items — no queue required for migrator.

## Performance

### Bounded batch ops
- Migrator: sequential or concurrency ≤5 for S3 EXIF backfill + PutItem.
- FeedPublisher: paginate `listPhotos` until exhausted; soft runtime minutes.
- No new API Gateway / CDN cache layer for photo GETs.

## Security

### Auth + projection + least privilege
- Migrator/CLI/admin writes: existing **HMAC** AuthVerifier (passcode session).
- Public DTOs continue to strip precise GPS.
- Secondary stack IAM: secrets get, DDB on primary table ARNs, S3 as needed — least privilege.
- Secrets Manager **ReplicaRegions: us-east-2** for photo-upload secrets.
- Cleanup scripts scoped to photo/gallery content paths only.

## Cross-cutting

| Pattern | Applied |
|---------|---------|
| CQRS-lite | Public read DTOs vs authenticated migrate/CLI/admin writes |
| Scheduled side-effect | EventBridge → FeedPublisher for feed artifacts |
| Operator dry-run | Migrator + cleanup scripts |
| Peer-stack parity | Mirror tickets-secondary / api-domain-secondary |
| Static blog unchanged | `output: "export"` + markdown prebuild for non-photos |

---

## Explicitly not applied

| Pattern | Reason |
|---------|--------|
| DynamoDB global tables (required) | Tickets use secondary → primary table; optional later |
| Circuit breaker / auto-retry storms | Personal traffic |
| Full Next.js rebuild for feeds | FR-9 / NFR-U7-F2 |
| New SNS alarm suite | NFR-U7-O2 |
| Bedrock in secondary (required) | Soft-fail enrichment; primary sufficient unless Infra mandates |
