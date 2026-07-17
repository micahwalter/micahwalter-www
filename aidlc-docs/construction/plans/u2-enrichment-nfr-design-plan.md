# U2 — Enrichment — NFR Design Plan

**Inputs**: `u2-enrichment/nfr-requirements/` (approved)  
**Goal**: Patterns and logical components (AWS resource names → Infrastructure Design)

Please answer every `[Answer]:` below.

---

## Plan checklist

- [x] Collect answers
- [x] Resolve ambiguities
- [x] Generate `nfr-design-patterns.md`
- [x] Generate `logical-components.md`
- [x] Present NFR Design completion (Continue → Infrastructure Design)

## Locked answers summary

| Q | Answer | Decision |
|---|--------|----------|
| 1 | A | Platform retries + EventBridge archive; no enricher DLQ |
| 2 | A | Sequential try/catch; single DynamoDB update |
| 3 | A | On-demand concurrency; one photo per invoke |
| 4 | A | Optimized cover only for Bedrock |
| 5 | A | Least-privilege enricher + DTO omits precise GPS |
| 6 | A | Minimal logical component set |
| 7 | A | Extend PublicDtoProjector / photo-dto in place |

---

## Questions

### Question 1 — Resilience / recovery pattern (NFR: archive, no DLQ)

A) **Platform retries + archive** — EventBridge → Lambda uses Lambda async retry defaults; enable **event bus archive** on `photo-bus` for replay; no enricher SQS DLQ (matches NFR Q4=B)

B) **A + explicit “re-enrich” path later** — document that U5/CLI/`force` can reset `failed`→`pending` and re-emit (design the pattern now; implement emit helper in Code Gen if cheap)

C) **Override NFR** — add enricher DLQ anyway for inspectability

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



### Question 2 — Step isolation pattern (geo vs Bedrock)

A) **Sequential try/catch per step** — GPS → Location → Bedrock → single DynamoDB update with merged fields; each step catches/logs independently (matches FD best-effort)

B) **Two-phase persist** — write geo fields immediately, then Bedrock tags in a second update (more DDB writes; clearer partial visibility mid-flight)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



### Question 3 — Scalability pattern

A) **On-demand only** — default Lambda concurrency; no reserved concurrency; one photo per invoke (NFR Q2=A)

B) **Soft concurrency hint** — document operator can set reserved concurrency=2 later without code change; do not set in U2

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



### Question 4 — Performance pattern (image / Bedrock)

A) **Stream/buffer optimized cover only** — download 1200px (or cover) variant; cap in-memory image size; no original for Bedrock

B) **A + early exit** — if cover missing, skip Bedrock (soft-fail) rather than falling back to original (FD chose optimized-only)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



### Question 5 — Security patterns

A) **Least-privilege enricher role + DTO projector** — enricher never used by HTTP API; PublicDtoProjector continues to omit precise GPS; structured logs use photoId/flags not raw coords

B) **A + separate Bedrock/Location IAM statements** clearly scoped in design (no wildcard resources beyond model/place-index ARNs)

C) **A + B**

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



### Question 6 — Logical components to include

A) **Minimal set** — EnrichmentWorker, PhotoStore (reuse), ImageObjectReader, GpsExtractor, PlaceReverseGeocoder, BedrockTagger, TagMerger, PublicDtoProjector (reuse/extend), EventBridgeArchive (ops concern)

B) **Minimal + EnrichmentStatusGate** — explicit component for complete/no-op and failed/pending re-entry rules

C) **Minimal + EnrichmentStatusGate + FuzzCoordinator** — named component for 3-decimal rounding + public field assignment

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



### Question 7 — Coupling to U1 PublicDtoProjector

A) **Extend existing projector in place** — add `city`/`country`/public coords mapping in U1 `photo-dto` module during U2 code gen

B) **Keep projector unchanged until fields exist** — enricher writes fields; DTO already passes through nulls; only add city/country keys in U2

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---
