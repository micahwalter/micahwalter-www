# U1 — Photo data plane — Infrastructure Design Plan

**Map**: Logical components → AWS on existing `micahwalter-photo-upload` stack  
**Region**: us-east-1 (U1)

Please answer every `[Answer]:` below.

---

## Questions

### Question 1 — DynamoDB table name

A) `photos` (simple; stack-scoped account)

B) `micahwalter-photos` (prefixed, matches other resource naming)

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

### Question 2 — GSI shape for newest-first list

A) **GSI1**: `gsi1pk` = constant `"PHOTO"`, `gsi1sk` = `{publishedAt}#{id}` (query newest with `ScanIndexForward=false`)

B) **GSI1**: `entityType` = `"photo"`, `publishedAt` as SK (id tie-break in filter/app if collisions)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



### Question 3 — Enrichment queue (publisher target in U1)

A) **Create SQS queue now** — e.g. `photo-enrichment-queue` + DLQ; process sends message; U2 adds consumer

B) **EventBridge custom bus/rule stub** — process PutEvents; U2 adds target

C) **Create queue in U2 only** — U1 PutItem without send (contradicts best-effort enqueue — only if you change that)

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---



### Question 4 — Process failure DLQ

A) **SQS DLQ** attached as Lambda `OnFailure` / Destination for async invoke from S3

B) **S3 event → SQS → Process** (queue between S3 and worker) with redrive DLQ — larger change

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



### Question 5 — New HTTP Lambdas vs monolithic zip

A) **Add routes in same zip** — new handlers in `photo-upload-lambdas` package (get/list/featured/patch) + CFN routes; keep one deployable artifact

B) **Separate Lambda functions** per route group (read vs write) still in same CFN stack

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



### Question 6 — DynamoDB backups / PITR in U1

A) **PITR enabled** on photos table

B) **PITR off in U1** — enable later

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



### Question 7 — Remove GitHub commit from process IAM/secrets

A) **Strip GitHub commit in U1** — remove commit code path; drop `githubToken` usage from process (secret field may remain unused until cleaned)

B) **Feature-flag keep code but disabled** — leave GitHub client dead-coded behind env `COMMIT_MARKDOWN=false`

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



### Question 8 — Shared infrastructure doc

A) **No separate shared-infrastructure.md** — document stack extension only under U1 infra design

B) **Create shared-infrastructure.md** noting api-domain, tickets, images bucket, artifacts bucket reuse

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



## Generation checklist

- [x] `infrastructure-design.md`
- [x] `deployment-architecture.md`
- [x] `shared-infrastructure.md` if B on Q8 — **skipped** (Q8=A)
- [x] Update state/audit

## Decisions locked

| Q | Choice |
|---|--------|
| 1 | B — table `micahwalter-photos` |
| 2 | A — GSI1 `PHOTO` / `{publishedAt}#{id}` |
| 3 | B — EventBridge enrichment stub |
| 4 | A — SQS process OnFailure DLQ |
| 5 | A — same Lambda zip + new routes |
| 6 | A — PITR on |
| 7 | A — strip GitHub commit from process |
| 8 | A — no separate shared-infrastructure.md |

---

When done, reply in chat.