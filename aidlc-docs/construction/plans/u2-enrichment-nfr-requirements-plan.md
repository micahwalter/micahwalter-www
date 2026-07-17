# U2 — Enrichment — NFR Requirements Plan

**Unit**: U2 Enrichment  
**Context**: Async EventBridge → Enrichment Lambda; Bedrock vision; AWS Location; DynamoDB photo updates  
**Functional design**: `aidlc-docs/construction/u2-enrichment/functional-design/`

Please answer every `[Answer]:` below.

---

## Plan checklist

- [x] Collect answers
- [x] Resolve ambiguities
- [x] Generate `nfr-requirements.md`
- [x] Generate `tech-stack-decisions.md`
- [x] Present NFR Requirements completion (Continue → NFR Design)

## Locked answers summary

| Q | Answer | Decision |
|---|--------|----------|
| 1 | A | Best-effort freshness (minutes) |
| 2 | A | Personal volume; no reserved concurrency |
| 3 | A | 60s / 1024 MB |
| 4 | B | EventBridge archive/replay; no enricher DLQ |
| 5 | A | Soft-fail providers; complete on finished update |
| 6 | A | Least-privilege IAM; no precise GPS in public DTO |
| 7 | A | CloudWatch logs only |
| 8 | A | us-east-1 only in U2 |
| 9 | A | Enricher in existing photo-upload zip/stack |
| 10 | A | Additive DTO fields; no new endpoints |

---

## Questions

### Question 1 — Enrichment latency / freshness goal

A) **Best effort** — No hard SLO; soft goal: most photos enriched within a few minutes of upload under normal load

B) **Soft target** — p95 enrichment complete within ~60s of EventBridge emit (excluding Bedrock/Location provider outages)

C) **Near-interactive** — aim under ~15s p95 (may need higher Lambda memory / provisioned concurrency)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



### Question 2 — Bedrock cost / concurrency controls

A) **Personal volume only** — default Lambda concurrency; no reserved concurrency; accept Bedrock on-demand pricing for tens of photos/day

B) **Cap concurrency** — reserved/max concurrency on enricher (e.g. 2) to bound Bedrock spend on retries/bursts

C) **A + daily soft budget alarm** — CloudWatch/billing alarm if Bedrock cost or invoke count spikes (optional SNS)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



### Question 3 — Enrichment Lambda timeout / memory

A) **Timeout 60s, memory 1024 MB** — enough for S3 download + Location + Bedrock on optimized image

B) **Timeout 120s, memory 1536 MB** — match process Lambda headroom for slower Bedrock

C) **Decide concrete numbers in NFR Design / Infra** — functional NFR only: “single invocation must finish geo+Bedrock for one photo”

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



### Question 4 — Retry / DLQ policy for enricher

A) **Lambda async retries (2) + DLQ** on the enricher (SQS DLQ); failed messages inspectable; photo may stay `pending`/`failed`

B) **EventBridge archive/replay only** — no dedicated enricher DLQ in U2

C) **SQS buffer between EventBridge and Lambda** despite FD choosing direct invoke (override FD Q10 for reliability)

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---



### Question 5 — Provider failure tolerance (Bedrock / Location)

A) **Confirm FD** — soft-fail Bedrock/Location; persist partial; `complete` if worker finishes update; log errors (NFR-6)

B) **Treat Location failure as harder** — if GPS exists but reverse-geocode fails after retries, mark `failed` (Bedrock still best-effort)

C) **Circuit-break** — after N consecutive Bedrock failures, skip AI tags for a cooldown window (advanced; probably overkill)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



### Question 6 — Security for Bedrock / Location / GPS

A) **Confirm defaults** — enricher IAM least-privilege (S3 read images, DynamoDB update, Bedrock invoke, Location search); no public API changes; precise GPS never in logs or public DTO; no secrets beyond existing stack patterns

B) **A + redact GPS from CloudWatch logs** (log “hasGps=true/false” only, not coordinates)

C) **A + B + explicit deny** of Bedrock/Location outside enricher role (document; IAM already scoped)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



### Question 7 — Observability for U2

A) **CloudWatch logs only** — structured enough (photoId, enrichmentStatus, step success/fail); existing process error alarm unchanged

B) **A + enricher error alarm** — CloudWatch alarm on enricher Lambda Errors (like process)

C) **A + B + metrics** — custom metrics for bedrock_fail / geo_skip / enrich_complete counts

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



### Question 8 — Region / multi-region for U2

A) **us-east-1 only in U2** — Bedrock + Location + Lambda + table in primary; multi-region parity in U7

B) **Require Bedrock model access documented for us-east-1**; still no secondary region in U2

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



### Question 9 — Tech stack confirmation

A) **Confirm** — Node.js enricher in existing `photo-upload` zip/stack; AWS SDK v3 (S3, DynamoDB, Bedrock Runtime Converse, Location); EventBridge rule on `photo-bus`; model `us.anthropic.claude-sonnet-4-6` per FD

B) **Same as A but separate Lambda zip/package** for enricher (heavier deps isolation)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



### Question 10 — Public DTO / API contract impact

A) **Additive only** — extend PublicPhotoDTO with `city`, `country`, populated public coords/tags when ready; no new endpoints in U2

B) **A + optional** `GET` field filtering later — not in U2

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

