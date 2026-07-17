# Requirements Clarification — Photo UX Polish

Please answer each question by filling in the `[Answer]:` tag (letter + any notes).

**Context already confirmed from the live site / code:**

1. **Map** — Your new upload (`id=171`) *does* have coordinates (`publicLatitude` / `publicLongitude`) and location tags (`port-washington`, `usa`). The detail page *tries* to render a static OSM map, but the image host `staticmap.openstreetmap.de` no longer resolves, so the component silently hides the map on load error.
2. **Tags** — API photo detail renders tags as plain `<span>`s (not links). Blog/MDX tags still link to `/tags/[tag]`, which only indexes markdown posts — not DynamoDB photos.
3. **Homepage** — Featured photo is fetched client-side after JS loads (`Loading photos…`). Static export cannot ISR the API response.
4. **Galleries** — Gallery *index* has the standard `max-w-wide mx-auto px-6` wrapper; gallery *detail* grid (`GalleryViewer`) does not, so thumbnails flush to the viewport edge.

---



## Question 1 — Photo detail map

How should we fix the missing map?

A) Replace the dead static-map host with an in-page OpenStreetMap embed / lightweight tile map (no API key), and always show the place label (city, country) even if the map fails

B) Keep a static map image, but switch to a different working static-map provider (may need an API key / account)

C) Drop the map image for now — show place text + a link to OpenStreetMap only

X) Other (please describe after [Answer]: tag below)

[Answer]:  A

---



## Question 2 — Clickable photo tags

When a visitor clicks a tag on a photo detail page, where should they go?

A) Filter the photos index: `/photos?tag=<tag>` (DynamoDB photos only; client or API filter)

B) Use the existing `/tags/<tag>` page, extended to include DynamoDB photos alongside blog posts

C) Both — tags link to `/photos?tag=<tag>` on photo pages; blog tags stay on `/tags/<tag>`

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



## Question 3 — Homepage featured photo loading

How should we reduce or remove the “Loading photos…” wait?

A) Bake featured (+ recent) photo metadata into the static homepage at **build/deploy time**, so the image can paint immediately; optionally soft-refresh from the API in the background

B) Keep client fetch, but show a skeleton / reserved aspect-ratio placeholder instead of a text loading message (faster perceived load, still waits on API)

C) Both A and B — build-time bake for first paint, plus skeleton fallback if the bake is stale/missing

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---



## Question 4 — Galleries layout bleed

Confirm the galleries fix:

A) Yes — wrap the gallery detail photo grid in the standard `max-w-wide mx-auto px-6` (and matching vertical padding), same as `/photos` and the galleries index. Leave the lightbox full-bleed.

B) Also tighten the gallery detail *header* / other spacing while you’re there (describe under X if you pick this via Other)

X) Other (please describe after [Answer]: tag below)

[Answer]: A + B

---



## Question 5 — Scope of this engagement

Anything else to include in this same pass?

A) Only the four items above (map, clickable tags, homepage featured load, galleries container)

B) Also include a small follow-up: show city/country text on photo detail even when there is no map

C) Also fix bare `GET /photos` (no trailing slash) API 404/500 quirks while we’re here

X) Other (please describe after [Answer]: tag below)

[Answer]:  yes fix these as well

---



## Question 6 — Security Extensions

Should security extension rules be enforced for this project?

A) Yes — enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)

B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---



## Question 7 — Resiliency Extensions

Should the resiliency baseline be applied to this project?

**What this extension is.** Enabling it applies a set of **directional, design-time best practices** for building resilient systems, derived from the **AWS Well-Architected Framework (Reliability Pillar)** and resilience-review guidance. It steers requirements, design, and code toward fault tolerance, high availability, observability, and recoverability.

**What this extension is NOT.** Enabling it does **not** make your workload production-ready, nor does it certify availability, RTO, or RPO. It is a starting point — not a substitute for a formal Well-Architected Review.

A) Yes — apply the resiliency baseline as directional best practices and design-time guidance

B) No — skip the resiliency baseline

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---



## Question 8 — Property-Based Testing Extension

Should property-based testing (PBT) rules be enforced for this project?

A) Yes — enforce all PBT rules as blocking constraints

B) Partial — enforce PBT rules only for pure functions and serialization round-trips

C) No — skip all PBT rules (suitable for UI-focused polish with little new algorithmic logic)

X) Other (please describe after [Answer]: tag below)

[Answer]: C