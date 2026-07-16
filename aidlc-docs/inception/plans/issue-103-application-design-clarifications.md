# Issue #103 / #104 — Application Design Clarifications

Thank you for the answers. Three items need a clearer lock before we approve the design plan and generate artifacts.

**Already clear**

| Q | Locked |
|---|--------|
| 1 | Extend existing `micahwalter-photo-upload` / `/photos` API |
| 2 | Node.js for new photo metadata Lambdas |
| 3 | Async enrichment via SQS/EventBridge after fast persist |
| 7 | Static map provider deferred (`StaticMap` port only in App Design) |
| 8 | Accept proposed component set |

---

## Clarification 1 — Frontend data access (your Q4: “Need more info”)

With **hybrid hosting**, the public site is still static HTML on S3. Photo data lives in DynamoDB behind `api.micahwalter.com`. Something in the browser (or a tiny helper) must call that API. The options differ only in *how we organize that fetch*:

| Option | What it means in practice |
|--------|---------------------------|
| **A — Client-side fetch only** | Each page (or component) calls `fetch('https://api.micahwalter.com/photos/...')` directly. Simple, but fetch URLs/headers may get duplicated. |
| **B — Thin helpers (`lib/photos-api.ts`)** | One shared module exports `getPhoto(id)`, `listPhotos()`, `getFeatured()`, etc. Pages import those helpers. **Same runtime behavior as A**, just cleaner code — recommended default for this repo. |
| **C — Build-time fallback + client refresh** | Optionally bake empty/placeholder HTML at build; always refresh from API when the page loads. More moving parts; only useful if you want non-JS fallbacks. |

### Clarification Question 1

Which frontend access pattern should we design for?

A) Client-side `fetch` scattered in components (no shared helper required)

B) Shared `lib/photos-api.ts` (or similar) wrappers — **recommended**

C) Build-time placeholder + always refresh from API on load

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Clarification 2 — Admin UI (your Q5: “A + C”)

You want both:

- **A** — `/upload` as a Photos admin hub (upload | edit | galleries)
- **C** — Edit controls on `/photos/[id]` when authenticated

That hybrid is fine if we define the rule:

### Clarification Question 2

How should A + C work together?

A) **Hub is primary; detail page has a shortcut** — Full upload / multi-edit / gallery admin live under `/upload` (or `/upload/*`). On `/photos/[id]`, an authenticated owner sees an “Edit” control that opens the hub editor (or inline fields) for that photo only. Galleries are only managed from the hub.

B) **Detail page is primary for single-photo edit; hub for batch + galleries** — `/photos/[id]` has full inline edit when authed. `/upload` hub handles multi-upload + gallery admin (+ optional list of photos to jump into edit).

C) **Everything on the hub only** — Drop per-detail edit for v1 (revisit later); you meant A as the real choice.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Clarification 3 — AWS Location Service costs (your Q6: “B — but let me know the costs”)

You chose **AWS Location Service** for reverse geocoding. For this site’s volume, cost is typically **negligible**:

| Item | Cost picture | Your likely usage |
|------|--------------|-------------------|
| Reverse geocode (Places **Core**) | Pay-per-request; AWS publishes bucket pricing on the [Location pricing page](https://aws.amazon.com/location/pricing/). Historically Core Places calls are on the order of **tens of cents per 1,000 requests** — check the live table for your region. | ~1 call per GPS photo on upload |
| Free tier note | Location free tier has included on the order of **20,000 Core Geocode/Reverse Geocode requests/month for 3 months** for eligible accounts (see current Free Tier table). | Backfill + early usage often fits free tier if eligible |
| Backfill ~43 photos | Likely **well under $1** even outside free tier | One-time |
| Ongoing | Tens of GPS uploads/month → typically **cents/month** | Ongoing |
| Storing results | If you persist place labels long-term, use the API’s intended-use / Stored bucket where required — may cost more per call; we should cache city/country on the photo record and avoid repeat calls | Design will cache on photo |
| Static maps | Separate from reverse-geocode; Q7 defers map provider | — |

**Bottom line for this site:** AWS Location reverse-geocode cost should be **negligible** (pennies to low dollars/year at your volume). Complexity cost (IAM, Place Index in CFN) is the real tradeoff vs Nominatim.

### Clarification Question 3

After seeing the cost picture, confirm reverse geocode provider:

A) **Stay with AWS Location Service** (recommended given low volume + AWS-native IAM)

B) **Switch to Nominatim / OSM** (free; rate-limit carefully)

C) **Defer provider** — design a `Geocoder` port only; pick in Infrastructure Design

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

When all three answers are filled, reply here and we will lock the Application Design plan for your approval before generating design docs.
