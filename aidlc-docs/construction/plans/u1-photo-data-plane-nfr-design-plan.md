# U1 — Photo data plane — NFR Design Plan

**Inputs**: `u1-photo-data-plane/nfr-requirements/` (approved)  
**Goal**: Choose patterns and logical components (not AWS resource names yet — that is Infrastructure Design)

Please answer every `[Answer]:` below.

---

## Questions

### Question 1 — Resilience / retries (process path)

A) **Fail fast, no retries in-process** — optimize/ticket failure → log + exit; rely on S3/Lambda redrive only if AWS retries the event; no DynamoDB row

B) **Limited retries** — retry ticket allocation 2–3 times with backoff; still no DDB row if still failing

C) **S3 retry + DLQ pattern in U1** — configure process failure destination for poison messages

X) Other (please describe after [Answer]: tag below)

[Answer]: C

---



### Question 2 — Enrichment enqueue resilience (U1 responsibility)

A) **Best-effort enqueue** — if queue send fails after successful PutItem, log error; photo remains `pending` for U2/manual redrive later

B) **Transactional outbox style** — don’t consider process success until enqueue succeeds (retry enqueue); else fail process after Put (accept possible orphan row + log)

C) **Defer enqueue wiring** — U1 only PutItem; U2 adds queue + backfill pending rows

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



### Question 3 — Scalability pattern

A) **Serverless on-demand only** — DynamoDB on-demand + Lambda concurrency defaults; no reserved concurrency

B) **Cap process concurrency** — reserved concurrency on process Lambda to protect optimize/sharp memory

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



### Question 4 — Performance pattern for reads

A) **Single-table query via GSI** — `publishedAt`+`id` access pattern; no in-memory cache component

B) **GSI + tiny in-Lambda memory cache** — cache featured result for ~30–60s in process memory (optional)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



### Question 5 — Security patterns

A) **Gateway + token verify middleware pattern** — shared `assertAuth(token)` on PATCH; DTO projector strips sensitive fields; least-privilege IAM roles per Lambda

B) **A + request body size limits** on PATCH/init at API Gateway

C) **A + B**

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



### Question 6 — Logical components to include in U1 NFR design

A) **Minimal set** — PhotoStore (DynamoDB), PhotoHttpApi, ProcessWorker, TicketClient, ImageOptimizer, EnrichmentQueuePublisher (client only), AuthVerifier, PublicDtoProjector

B) **Minimal + IdempotencyGuard** — also track processed S3 object keys to avoid double-create on Lambda retry

C) **Minimal + IdempotencyGuard + CursorCodec** — explicit component for opaque list cursors

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



## Generation checklist

- [x] `nfr-design-patterns.md`
- [x] `logical-components.md`
- [x] Update state/audit

## Decisions locked

| Q | Choice |
|---|--------|
| 1 | C — Process DLQ / failure destination |
| 2 | A — Best-effort enrichment enqueue |
| 3 | A — On-demand, no reserved concurrency |
| 4 | A — GSI reads, no in-memory cache |
| 5 | A — AuthVerifier + DTO projector + least privilege |
| 6 | A — Minimal logical component set |

---

When done, reply in chat.