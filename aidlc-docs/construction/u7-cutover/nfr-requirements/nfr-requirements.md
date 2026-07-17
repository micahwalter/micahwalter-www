# U7 — NFR Requirements

**Unit**: Cutover  
**Decisions**: Derived from Requirements NFR-1–7 / FD / peer stacks (tickets, images CRR, newsletter-secondary)

---

## Scalability

| ID | Requirement |
|----|-------------|
| NFR-U7-S1 | Personal / low traffic; ~44 existing photos; migration is one-time batch. |
| NFR-U7-S2 | DynamoDB **on-demand** retained for photos + galleries. |
| NFR-U7-S3 | Multi-region **in scope for U7**: primary **us-east-1** + secondary **us-east-2**, on par with tickets/images/API stacks. |

## Performance

| ID | Requirement |
|----|-------------|
| NFR-U7-P1 | **Best effort** — no hard SLO for migrate/CLI/feeds. |
| NFR-U7-P2 | Migrator may process photos sequentially or with modest concurrency; complete in minutes for ~44 items. |
| NFR-U7-P3 | Feed job runtime soft goal: under a few minutes; paginate photo list. |
| NFR-U7-P4 | **No CDN/API response caching** change required for photo GETs (align U1). |

## Availability / reliability

| ID | Requirement |
|----|-------------|
| NFR-U7-R1 | Photo + gallery data plane: **secondary us-east-2 API/Lambda stack** with Route53/API domain failover posture like tickets/newsletter; DynamoDB access pattern matches tickets (secondary → primary table unless Infra chooses global tables). |
| NFR-U7-R2 | Images already use S3 CRR + CloudFront origin failover — U7 must not break that; no mandatory re-key (NFR-5). |
| NFR-U7-R3 | Migration **idempotent**; dry-run default; partial failure re-runnable. |
| NFR-U7-R4 | Content cleanup only after API verify; site build must succeed post-cleanup. |
| NFR-U7-R5 | Feed job failure must not break site deploy; next schedule retries; blog prebuild feeds remain for markdown. |
| NFR-U7-R6 | Enrichment/Bedrock remain soft-fail (existing U2); CLI tag is backfill path. |

## Security

| ID | Requirement |
|----|-------------|
| NFR-U7-SEC1 | Migrator/CLI writes use existing passcode → HMAC (or equivalent) auth; no secrets in git. |
| NFR-U7-SEC2 | Public read API continues to hide precise GPS. |
| NFR-U7-SEC3 | Cleanup scripts only touch photo/gallery content paths; never blog/email. |
| NFR-U7-SEC4 | Least-privilege IAM for feed publisher + any secondary stack roles. |
| NFR-U7-SEC5 | Security Baseline extension **disabled** — apply baseline practices only. |

## Feeds / publish latency

| ID | Requirement |
|----|-------------|
| NFR-U7-F1 | New uploads remain visible via live API **without** waiting for site deploy (NFR-1). |
| NFR-U7-F2 | RSS/sitemap **photo** URLs updated by scheduled job without full Next.js rebuild (FR-9). |
| NFR-U7-F3 | Feed photo links use `/photos/<id>`. |
| NFR-U7-F4 | Blog/email RSS/sitemap stay on existing prebuild path (NFR-2). |

## Observability

| ID | Requirement |
|----|-------------|
| NFR-U7-O1 | CloudWatch logs for feed job + secondary API Lambdas; migrator/CLI stdout summary. |
| NFR-U7-O2 | **No new SNS alarms required** in U7 (align U1/U6); optional follow-up. |

## Maintainability / ops

| ID | Requirement |
|----|-------------|
| NFR-U7-M1 | Prefer extending existing stacks (`photo-upload`, `infra`, CLI scripts) over new product surfaces. |
| NFR-U7-M2 | Secondary stack naming/deploy path mirrors tickets/newsletter (`*-secondary`, us-east-2). |
| NFR-U7-M3 | Document cutover runbook: migrate → verify → feeds → multi-region → cleanup. |
| NFR-U7-M4 | Resiliency Baseline extension **disabled** — multi-region NFR still enforced via NFR-3. |

## Compatibility

| ID | Requirement |
|----|-------------|
| NFR-U7-C1 | Existing photo numeric ids remain stable (NFR-7). |
| NFR-U7-C2 | Legacy `/posts/<digits>` redirects remain valid after migrate. |
| NFR-U7-C3 | Static blog `output: "export"` unchanged. |
