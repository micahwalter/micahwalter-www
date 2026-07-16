# U2 — Enrichment — Infrastructure Design Plan

**Map**: Enrichment logical components → AWS on `micahwalter-photo-upload`  
**Region**: us-east-1  
**Inputs**: U2 FD + NFR Design (approved)

Please answer every `[Answer]:` below (or reply in chat with `1A 2A …`).

---

## Plan checklist

- [ ] Collect answers
- [ ] Resolve ambiguities
- [ ] Generate `infrastructure-design.md`
- [ ] Generate `deployment-architecture.md`
- [ ] Present Infrastructure Design completion (Continue → Code Generation)

---

## Questions

### Question 1 — EventBridge rule target wiring

A) **Rule on `photo-bus`**: source `micahwalter.photos`, detail-type `PhotoPendingEnrichment` → target Enrichment Lambda (async invoke)

B) **Same as A** but also match any source and filter only on detail-type (looser)

X) Other (please describe after [Answer]: tag below)

[Answer]: 

---



### Question 2 — EventBridge archive retention

A) **Archive on `photo-bus`** with **14-day** retention (replay window)

B) **Archive with 30-day** retention

C) **Archive with 7-day** retention

X) Other (please describe after [Answer]: tag below)

[Answer]: 

---



### Question 3 — AWS Location Place Index

A) **Create Place Index in this stack** — e.g. `micahwalter-photos-place-index` using Esri or HERE data source (pick default Esri) for ReverseGeocode

B) **Reuse an existing Place Index** if one already exists in the account (name provided under X / Other)

C) **Create Place Index with HERE** data source instead of Esri

X) Other (please describe after [Answer]: tag below)

[Answer]: 

---



### Question 4 — Bedrock model access assumption

A) **Document prerequisite** — operator must enable model access for `us.anthropic.claude-sonnet-4-6` (or inference profile) in us-east-1; no CFN resource for model access

B) **Fail enricher clearly** if model not enabled (logged soft-fail / status still complete per FD) — still no CFN for access

X) Other (please describe after [Answer]: tag below)

[Answer]: 

---



### Question 5 — Optimized cover object key for Bedrock

Process writes variants under `images/posts/{folder}/` (e.g. `photo-1200.webp` / jpeg). Confirm which key the enricher loads:

A) **Prefer `photo-1200.jpg` then `photo-1200.webp` then `coverImageKey` basename variants** — implement small key resolution helper matching current optimize output names

B) **Always use `coverImageKey` as stored on the Photo record** (whatever process set as primary cover)

X) Other (please describe after [Answer]: tag below)

[Answer]: 

---



### Question 6 — CI IAM for new resources

A) **Extend `GitHubActionsDeployPhotoUpload`** — Place Index, EventBridge archive + rule, Enrichment Lambda/role, Bedrock invoke not needed for CI (runtime role only)

B) **A + allow `events:PutRule` / `PutTargets` / archive APIs** scoped to `photo-bus`

X) Other (please describe after [Answer]: tag below)

[Answer]: 

---



### Question 7 — Enrichment Lambda packaging

A) **Same zip** `photo-upload.zip` — new handler `src/enrich.handler`; CFN `EnrichFn` 60s / 1024 MB

B) **Same zip but separate entrypoint name** `src/enrichment.handler` (naming only)

X) Other (please describe after [Answer]: tag below)

[Answer]: 

---



### Question 8 — Shared infrastructure doc

A) **No new shared-infrastructure.md** — document under U2 infra design only

B) **Create/update shared-infrastructure.md** for photo-bus archive + Place Index reuse notes

X) Other (please describe after [Answer]: tag below)

[Answer]: 

---
