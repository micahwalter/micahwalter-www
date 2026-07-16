# U1 — Photo data plane — Functional Design Plan

**Unit**: U1 Photo data plane  
**Stories**: US-002  
**Components**: PhotoRepository, PhotoCommandService, PhotoQueryService, UploadProcessPipeline (persist), Auth  

Please answer every `[Answer]:` below. After validation and plan approval, artifacts will be generated under `aidlc-docs/construction/u1-photo-data-plane/functional-design/`.

---

## Questions

### Question 1 — Photo record identity & timestamps

A) **id (number/string from tickets) as partition key**; `publishedAt` ISO date; `createdAt`/`updatedAt` ISO timestamps on every write

B) **id as PK** + `publishedAt` only (no separate created/updated)

X) Other (please describe after [Answer]: tag below)

[Answer]: 

---

### Question 2 — Initial record status after process (before enrichment)

A) **`enrichmentStatus: pending`** — photo is already **publicly listable/gettable** (may lack AI tags/geo until U2)

B) **`enrichmentStatus: pending` + `visibility: private`** until enrichment completes (or timeout) — then public

C) **Always public**; enrichmentStatus informational only

X) Other (please describe after [Answer]: tag below)

[Answer]: 

---

### Question 3 — Caption / title defaults when upload omits them

A) **Title** defaults to sanitized filename; **caption** defaults to empty string (UI may show nothing)

B) **Title** from filename; **caption** defaults to legacy-style “Photo taken with {camera}” when EXIF camera exists, else empty

C) **Require title** at init (reject upload-url without title); caption optional empty

X) Other (please describe after [Answer]: tag below)

[Answer]: 

---

### Question 4 — Public list sort & pagination

A) **Sort `publishedAt` desc, then `id` desc**; cursor pagination (`limit` + opaque cursor)

B) **Sort `publishedAt` desc**; offset/limit page numbers

X) Other (please describe after [Answer]: tag below)

[Answer]: 

---

### Question 5 — Featured photo rule (API)

A) **Newest photo with `featured=true`**; if none, newest photo overall (match today’s `getFeaturedPhoto`)

B) **Newest featured only**; if none, return null (homepage hides hero)

X) Other (please describe after [Answer]: tag below)

[Answer]: 

---

### Question 6 — Draft handling in U1

A) **Support `draft` boolean**; public list/get omit drafts; auth get can include drafts

B) **No drafts in U1** — all processed uploads are published (`draft=false` always)

X) Other (please describe after [Answer]: tag below)

[Answer]: 

---

### Question 7 — Process failure / partial write rules

A) **If optimize or ticket id fails → no DynamoDB write**; S3 original may remain (lifecycle expires). Log error.

B) **Write a `failed` record** with error message when possible after id allocation, for admin visibility

X) Other (please describe after [Answer]: tag below)

[Answer]: 

---

### Question 8 — Auth for write APIs in U1

A) **Reuse existing photo-upload HMAC token** (same as `/upload`) for create-from-process (IAM) and owner PATCH

B) **Process uses IAM only** (no token); browser PATCH uses HMAC token

X) Other (please describe after [Answer]: tag below)

[Answer]: 

---

## Generation checklist (after answers + approval)

- [ ] `business-logic-model.md`
- [ ] `business-rules.md`
- [ ] `domain-entities.md`
- [ ] Update state/audit

---

When done answering, reply in chat.
