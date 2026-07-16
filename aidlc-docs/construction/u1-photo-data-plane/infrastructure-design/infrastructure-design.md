# U1 — Infrastructure Design

**Stack**: Extend `micahwalter-photo-upload` (`infra/photo-upload.yml` + `infra/photo-upload-lambdas/`)  
**Region**: us-east-1  

---

## Logical → AWS mapping

| Logical component | AWS / impl |
|-------------------|------------|
| PhotoStore | DynamoDB table `micahwalter-photos` + GSI1 |
| PhotoHttpApi | API Gateway HTTP API routes on existing Photo API + handlers in same Lambda zip |
| ProcessWorker | Existing `ProcessFn` Lambda (behavior change) + **async failure Destination → SQS DLQ** |
| TicketClient | HTTPS to `api.micahwalter.com/tickets` (unchanged) |
| ImageOptimizer | Existing sharp optimize → `micahwalter-www-images` |
| EnrichmentQueuePublisher | **EventBridge** `PutEvents` on a photo bus (U2 adds rule/target) |
| AuthVerifier | Existing HMAC token lib + Secrets Manager `photo-upload-secrets` |
| PublicDtoProjector | In-process mapping in read handlers |

---

## DynamoDB — `micahwalter-photos`

| Attribute | Role |
|-----------|------|
| `id` (S) | Partition key |
| `gsi1pk` (S) | GSI1 PK — constant `"PHOTO"` for public listings |
| `gsi1sk` (S) | GSI1 SK — `{publishedAt}#{id}` (ISO date + id) |
| remaining Photo fields | As domain entity (title, caption, tags, draft, featured, exif map, keys, enrichmentStatus, timestamps, …) |

**Billing**: On-demand  
**PITR**: **Enabled**  
**GSI1**: Projection ALL (or INCLUDE needed list fields — prefer ALL for U1 simplicity)  
**Query**: `gsi1pk = PHOTO`, `ScanIndexForward=false`, exclusive start key from cursor  

**Featured**: Query newest N from GSI1 among non-draft; prefer first with `featured=true`, else first item (app-level; optional sparse GSI later).

---

## EventBridge — enrichment handoff

| Resource | Purpose |
|----------|---------|
| Event bus (e.g. `photo-bus` or default bus with source `micahwalter.photos`) | Process emits `PhotoPendingEnrichment` after PutItem |
| Detail | `{ "photoId": "<id>" }` |
| Rule / target | **Stub in U1** (rule may log or no target); **U2** attaches enricher Lambda |

Best-effort: PutEvents failure logged; photo remains `pending`.

---

## Process failure DLQ

| Resource | Purpose |
|----------|---------|
| SQS queue e.g. `photo-upload-process-dlq` | Lambda asynchronous invocation **OnFailure** destination for ProcessFn |
| Retention | ≥14 days recommended |

S3 → Lambda remains direct; platform retries then DLQ.

---

## API Gateway routes (additions)

Existing: `POST /photos/auth`, `POST /photos/upload-url`  

**U1 add** (same HTTP API / mapping key `photos`):

| Method | Path | Auth |
|--------|------|------|
| GET | `/photos` | none (list; query `limit`, `cursor`) |
| GET | `/photos/featured` | none |
| GET | `/photos/{id}` | none |
| PATCH | `/photos/{id}` | HMAC token (header/body as existing patterns) |

Handlers live in the **same deployable zip** as auth/init/process (new entrypoints or router).

---

## Process Lambda changes

1. After optimize + ticket id → `PutItem` to `micahwalter-photos` (`enrichmentStatus=pending`, defaults per FD).  
2. `PutEvents` enrichment event (best effort).  
3. **Remove** GitHub commit path and GitHub API usage from process.  
4. IAM: add DynamoDB read/write, `events:PutEvents`; remove GitHub-related secret usage from process code (secret may still hold unused `githubToken` until cleaned).  
5. Configure failure Destination → process DLQ.

Init Lambda: accept/pass **caption** (and title/featured) as S3 object metadata for process (U3 UI will send; U1 API contract ready).

---

## Unchanged shared resources (referenced, not redesigned)

- `api.micahwalter.com` (`infra/api-domain.yml`)  
- Tickets API / `post_tickets`  
- Uploads bucket `micahwalter-photo-uploads`  
- Images bucket `micahwalter-www-images`  
- Lambda artifacts bucket `micahwalter-newsletter-artifacts`  
- Secrets Manager `photo-upload-secrets` (passcode, hmac, ticketsPasscode; githubToken unused by process after U1)

---

## Out of scope for U1 infra

- Enrichment consumer Lambda + Bedrock/Location (U2)  
- Multi-region / global tables (U7)  
- CloudFront in front of photo API  
- Galleries table (U6)  
- Frontend Next.js hosting changes (U3/U4)
