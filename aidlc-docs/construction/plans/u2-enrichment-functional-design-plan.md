# U2 — Enrichment — Functional Design Plan

**Unit**: U2 Enrichment  
**Stories**: US-003, US-004  
**Components**: EnrichmentService, PhotoRepository; Bedrock; AWS Location  
**Depends on**: U1 (`PhotoPendingEnrichment` on `photo-bus`; DynamoDB photo record)

Please answer every `[Answer]:` below. After validation and plan approval, artifacts will be generated under `aidlc-docs/construction/u2-enrichment/functional-design/`.

---

## Plan checklist

- [ ] Collect answers to clarification questions
- [ ] Resolve any ambiguities / follow-ups
- [ ] Approve plan
- [ ] Generate `domain-entities.md`
- [ ] Generate `business-rules.md`
- [ ] Generate `business-logic-model.md`
- [ ] Present Functional Design completion (Continue → NFR Requirements)

---

## Questions

### Question 1 — Where precise GPS is first extracted

U1 today stores `latitude`/`longitude` as `null` and `extractExif` does not yet pull GPS. Enrichment needs GPS for reverse-geocode + fuzzing.

A) **Enricher owns GPS** — U2 reads the original from S3, extracts GPS, writes precise + public coords (U1 process unchanged for GPS)

B) **Process extracts GPS in U2 PR** — small U1 process/`exif.js` change writes precise coords at create; enricher only fuzzes + reverse-geocodes + Bedrock

C) **Both** — process writes GPS when present; enricher can re-extract from S3 if coords are still null (backfill / older pending rows)

X) Other (please describe after [Answer]: tag below)

[Answer]: 

---



### Question 2 — Public coordinate fuzzing algorithm

A) **Round to ~3 decimal places** (~110m) for both lat/lon (simple, deterministic)

B) **Round to ~2 decimal places** (~1.1km) for stronger privacy

C) **Quantize to a fixed grid** (e.g. 0.01° cells) and publish cell center

X) Other (please describe after [Answer]: tag below)

[Answer]: 

---



### Question 3 — City / country tag shape from reverse geocode

A) **Two tags**: lowercase hyphenated city + country (e.g. `brooklyn`, `united-states`) merged into `tags[]`

B) **One place tag** only (prefer city; fall back to region/country) plus separate optional `locationLabel` string field on the record for display

C) **Structured fields** `city` / `country` on the photo **and** mirrored into `tags[]` for search/filter

X) Other (please describe after [Answer]: tag below)

[Answer]: 

---



### Question 4 — Tag merge policy (author vs geo vs AI)

Today new photos start with `tags: ['photography']`. Enrichment adds geo + Bedrock tags. Authors may later edit tags (U5).

A) **Union merge, case-normalized** — keep existing tags; add geo + AI tags; de-dupe; never remove author tags; never touch title/caption

B) **Replace AI-suggested subset only** — keep non-AI tags; rewrite a reserved AI tag set (harder without provenance)

C) **Full replace of content tags** each enrichment run — keep only `photography` + new geo + AI (would wipe manual edits on re-run)

X) Other (please describe after [Answer]: tag below)

[Answer]: 

---



### Question 5 — Bedrock tagging parity with `scripts/tag-photos.js`

A) **Same prompt intent + model family** as CLI (`us.anthropic.claude-sonnet-4-6` / Converse vision): 3–8 lowercase hyphenated tags; parse comma-separated list

B) **Same prompt intent** but allow a **cheaper/faster** Bedrock vision model if quality is acceptable (document model id in NFR/tech stack)

C) **Defer model choice to NFR** — functional design only requires “3–8 content tags, tags-only, merge”

X) Other (please describe after [Answer]: tag below)

[Answer]: 

---



### Question 6 — Image input to Bedrock

A) **Use optimized cover** from images bucket (smaller, cheaper) — e.g. 1200px JPEG/WebP already written by process

B) **Use original** from `images/originals/...` (max fidelity)

C) **Prefer optimized; fall back to original** if optimized missing

X) Other (please describe after [Answer]: tag below)

[Answer]: 

---



### Question 7 — Enrichment status semantics

A) **`complete`** only when the enrichment attempt finished (geo skipped OK if no GPS; Bedrock tags applied or empty after soft-fail); **`failed`** only when the worker crashed / could not update the record after retries; photo stays public either way

B) **`complete`** requires Bedrock success; geo optional; Bedrock failure → `failed` but photo remains public

C) **`partial`** status when geo OK but Bedrock failed (or vice versa); else `complete` / `failed`

X) Other (please describe after [Answer]: tag below)

[Answer]: 

---



### Question 8 — Partial failure behavior (geo vs Bedrock)

A) **Best-effort independent steps** — run GPS/geo then Bedrock (or reverse); persist whatever succeeded; log failures; do not roll back the other step

B) **All-or-nothing enrichment write** — only update DynamoDB when both applicable steps succeed (no GPS ⇒ Bedrock-only still OK)

X) Other (please describe after [Answer]: tag below)

[Answer]: 

---



### Question 9 — Idempotency / re-delivery

`PhotoPendingEnrichment` may be delivered more than once.

A) **Safe re-run** — if `enrichmentStatus` is already `complete`, no-op (skip); if `pending`/`failed`, run again and merge tags

B) **Always re-run** merge (even if `complete`) — useful for forced refresh; accept Bedrock cost on duplicates

C) **Conditional** — no-op when `complete` unless event detail includes `force: true` (CLI/backfill later)

X) Other (please describe after [Answer]: tag below)

[Answer]: 

---



### Question 10 — Trigger shape for the enricher (business sequencing)

U1 already emits EventBridge `PhotoPendingEnrichment` `{ photoId }` on `photo-bus`.

A) **EventBridge rule → Enrichment Lambda directly** (simplest; retries via Lambda async / rule DLQ as designed in infra later)

B) **EventBridge → SQS queue → Enrichment Lambda** (buffer + visibility timeout; preferred if we want stronger retry isolation)

C) **Decide in Infrastructure Design** — functional design only assumes “async message with `photoId` after persist”

X) Other (please describe after [Answer]: tag below)

[Answer]: 

---



### Question 11 — Photos without GPS

A) **Skip geo steps entirely**; still run Bedrock tags; leave `latitude`/`longitude`/`public*` null

B) **Skip geo + still Bedrock**; also set an explicit `geoStatus: none` field (in addition to enrichmentStatus)

X) Other (please describe after [Answer]: tag below)

[Answer]: 

---



### Question 12 — AWS Location place index / result preference

A) **Prefer municipality/city label + country**; if city missing use region/state name as the city-tag substitute

B) **Require both city and country**; if either missing, skip geo tags (coords still fuzzed if GPS exists)

C) **Decide concrete Place Index / API in Infrastructure Design**; functional design only requires city+country tags when the provider returns them

X) Other (please describe after [Answer]: tag below)

[Answer]: 

---
