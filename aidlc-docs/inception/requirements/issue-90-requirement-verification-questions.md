# Issue #90 — Requirements Clarification Questions

**GitHub Issue:** [#90 — Investigate and reduce GitHub Actions deploy time](https://github.com/micahwalter/micahwalter-www/issues/90)

Please answer each question by filling in the letter choice after the `[Answer]:` tag. Choose **Other** if none of the options fit and describe your preference.

---

## Question 1 — Implementation scope for this engagement

Issue #90 lists several optimizations. Which should we implement **in this branch**?

A) **Phase 1 only** — Redirect consolidation (remove ~1,150 pre-generated redirect pages; handle via CloudFront Function or equivalent) + CI `.next/cache` caching + build metrics logging

B) **Phase 1 + micro pages** — Above, plus reduce `/micro/[id]` static pages (e.g. listing-only or paginated)

C) **Phase 1 + micro + tag pages** — Above, plus reduce `/tags/[tag]` static generation

D) **Phase 1 + deploy pipeline** — Above (Phase 1), plus optimize S3 sync (single-pass or faster strategy)

E) **All high-impact items from the issue** — Redirects, micro, tags, S3 sync, CI cache, build metrics

F) Other (please describe after [Answer]: tag below)

[Answer]: B

---



## Question 2 — Legacy redirect URL requirements

Which URL patterns **must** continue to work with **301 redirects** to `/posts/[slug]`?

A) **All current patterns** — `/YYYY/slug`, `/YYYY/slug-as-year`, `/YYYY/MM/slug-as-day`, `/YYYY/MM/DD/slug`

B) **Year + slug only** — `/YYYY/slug` (e.g. `/2024/my-post`) is the main legacy pattern; date-based redirects are lower priority

C) **Audit first** — Check analytics/logs before deciding; implement redirects for patterns that actually receive traffic

D) Other (please describe after [Answer]: tag below)

[Answer]: A

---



## Question 3 — Redirect implementation mechanism

Where should legacy redirects be handled after removing Next.js pre-generated redirect pages?

A) **CloudFront Function** on the main `www` distribution (repo already uses CF Functions for apex redirect and static routing)

B) **S3 website redirect rules** or static redirect objects (no infra template changes)

C) **Keep minimal Next.js redirect routes** — only remove the year×slug explosion, keep simpler redirect pages

D) Other (please describe after [Answer]: tag below)

[Answer]: A

---



## Question 4 — `/micro/[id]` per-toot pages (427 static pages today)

Are individual `/micro/[id]` permalink pages with OG metadata required?

A) **Yes, keep per-toot pages** — permalinks and social previews matter; defer micro optimization to a later phase

B) **No, listing only** — `/micro` index is enough; drop `/micro/[id]` static generation entirely

C) **Paginate** — keep a small number of static micro pages (e.g. recent 20) without one page per toot

D) Other (please describe after [Answer]: tag below)

[Answer]: A

---



## Question 5 — `/tags/[tag]` pages (335 static pages today)

How should tag archive pages be handled?

A) **Keep all static tag pages** — SEO and sitemap indexing are important; defer tag optimization

B) **Client-side filtering** — single `/tags` page + filter via `posts.json` (remove per-tag static generation)

C) **Threshold only** — statically generate tags with 2+ posts; single-post tags use client filter or omit

D) Other (please describe after [Answer]: tag below)

[Answer]: A

---



## Question 6 — Deploy time target for this engagement

What is the realistic success criterion for CI deploy duration after Phase 1 work?

A) **Under 2 minutes consistently** (realistic first milestone from the issue)

B) **Under 90 seconds** (stretch goal)

C) **Measurable improvement only** — log before/after metrics; no hard time target yet

D) Other (please describe after [Answer]: tag below)

[Answer]: A

---



## Question 7 — Build metrics in CI

Should we add deploy-time logging of page count, build duration, and S3 sync duration to the workflow?

A) **Yes** — echo metrics in the workflow summary and/or a small build artifact for trend tracking

B) **No** — skip metrics tooling; focus on optimizations only

C) Other (please describe after [Answer]: tag below)

[Answer]: A

---



## Question 8 — Security Extensions

Should security extension rules be enforced for this project?

A) Yes — enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)

B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)

C) Other (please describe after [Answer]: tag below)

[Answer]: B

---



## Question 9 — Resiliency Extensions

Should the resiliency baseline be applied to this project?

A) Yes — apply the resiliency baseline as directional best practices and design-time guidance

B) No — skip the resiliency baseline (suitable for PoCs, prototypes, and experimental projects)

C) Other (please describe after [Answer]: tag below)

[Answer]: B

---



## Question 10 — Property-Based Testing Extension

Should property-based testing (PBT) rules be enforced for this project?

A) Yes — enforce all PBT rules as blocking constraints

B) Partial — enforce PBT rules only for pure functions and serialization round-trips

C) No — skip all PBT rules

D) Other (please describe after [Answer]: tag below)

[Answer]: C