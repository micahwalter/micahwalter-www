# Issue #90 — Requirements

**GitHub Issue:** [#90 — Investigate and reduce GitHub Actions deploy time](https://github.com/micahwalter/micahwalter-www/issues/90)  
**Branch:** `cursor/deploy-build-optimization-780e`

## Intent Analysis

| Field | Value |
|-------|-------|
| **User request** | Reduce GitHub Actions deploy time (currently 2–5 minutes) by addressing static page generation overhead and CI/deploy pipeline inefficiencies |
| **Request type** | Enhancement (performance / CI optimization) |
| **Scope estimate** | Multiple components — Next.js route generators, CloudFront infra, GitHub Actions workflow |
| **Complexity estimate** | Moderate — redirect consolidation touches app routes and CloudFront; CI changes are straightforward |

## Problem Statement

Production builds generate **~2,295 static pages**, of which **~1,150 are redirect-only** pages pre-rendered by Next.js solely to support legacy URL patterns. CI deploys spend roughly **58–62s building** and **50–85s syncing to S3**, for a total of **2–3+ minutes** per deploy.

Static export (`output: "export"`) requires a full rebuild of every `generateStaticParams` route on each deploy — incremental page generation is not available.

## Scope — In Scope (This Engagement)

### FR-1: Redirect consolidation

Remove pre-generated Next.js redirect pages and handle legacy URL redirects at the edge.

**Legacy patterns that MUST continue to work with 301 redirects to `/posts/[slug]`:**

| Pattern | Example | Current Next.js route |
|---------|---------|----------------------|
| `/YYYY/slug` | `/2024/my-post` | `app/[year]/page.tsx`, `app/[year]/[month]/page.tsx` |
| `/YYYY/slug-as-year` | `/my-post` (slug used as year param) | `app/[year]/page.tsx` |
| `/YYYY/MM/slug-as-day` | `/2024/03/my-post` | `app/[year]/[month]/[day]/page.tsx` |
| `/YYYY/MM/DD/slug` | `/2024/03/05/my-post` | `app/[year]/[month]/[day]/[slug]/page.tsx` |

**Implementation:** CloudFront Function on the main `www` distribution (repo already uses CF Functions for apex redirect and static HTML routing).

**Pages removed from static generation (approximate):**

- ~864 year×slug combos in `app/[year]/[month]/page.tsx`
- ~144 slug-as-year in `app/[year]/page.tsx`
- ~144 date redirect routes in `app/[year]/[month]/[day]/page.tsx`
- ~144 date redirect routes in `app/[year]/[month]/[day]/[slug]/page.tsx`

**Pages retained:**

- Real year archive pages (`/2024`, `/2025`, …)
- Real month archive pages (`/2024/03`, …)

### FR-2: CI build cache

Cache `.next/cache` in GitHub Actions between deploy workflow runs to reduce compile time on warm builds.

### FR-3: Build and deploy metrics

Add logging to the deploy workflow for trend tracking:

- Static page count (from build output)
- Build step duration
- S3 sync duration
- Total job duration

Surface in workflow summary and/or job output.

## Scope — Explicitly Out of Scope (Deferred)

| Item | Reason |
|------|--------|
| `/micro/[id]` per-toot page reduction | User chose to defer (clarification Q1: **A**) |
| `/tags/[tag]` static page reduction | User chose to keep all static tag pages for SEO |
| S3 single-pass sync optimization | Not in Phase 1 scope |
| Custom content-only deploy pipeline | Future consideration per issue comment |
| Incremental CloudFront invalidation | Not in Phase 1 scope |
| Architecture change away from static export | Out of scope |

## Non-Functional Requirements

### NFR-1: Performance

- **Target:** Deploy workflow completes **under 2 minutes consistently** after optimizations
- **Baseline:** ~2m21s–3m03s (build ~60s + S3 sync ~50–85s)
- **Expected improvement:** Removing ~1,150 redirect pages should cut static generation time substantially; CI cache reduces compile time on warm builds

### NFR-2: SEO / URL compatibility

- All four legacy redirect patterns must return **301 Moved Permanently**
- Destination must remain `/posts/[slug]`
- No broken inbound links from existing content, sitemap, or external references

### NFR-3: Reliability

- CloudFront Function must handle edge cases: unknown slugs → 404 or pass-through to origin (define behavior in design)
- Static export build must succeed with reduced `generateStaticParams` output
- Existing real archive pages (`/YYYY`, `/YYYY/MM`) must continue to work

### NFR-4: Observability

- Deploy metrics logged on every run for before/after comparison
- Document expected page count reduction in PR / construction summary

### NFR-5: Maintainability

- Redirect logic documented in code comments and/or aidlc construction artifacts
- CloudFront Function changes versioned in `infra/infra.yml` alongside existing functions

## Extension Configuration

| Extension | Enabled |
|-----------|---------|
| Security Baseline | No |
| Resiliency Baseline | No |
| Property-Based Testing | No |

## Acceptance Criteria

- [ ] Pre-generated redirect routes removed from Next.js (`generateStaticParams` no longer emits year×slug or date redirect combos)
- [ ] CloudFront Function handles all four legacy redirect patterns with 301 → `/posts/[slug]`
- [ ] Real year and month archive pages still generated and served correctly
- [ ] `.next/cache` cached in GitHub Actions deploy workflow
- [ ] Build metrics (page count, build time, S3 sync time) logged in CI
- [ ] `npm run build` succeeds locally with measurably fewer static pages (~1,100+ reduction)
- [ ] Deploy workflow target: under 2 minutes consistently (validate on merge)

## References

- Issue: https://github.com/micahwalter/micahwalter-www/issues/90
- Workflow: `.github/workflows/deploy.yml`
- Redirect routes: `app/[year]/page.tsx`, `app/[year]/[month]/page.tsx`, `app/[year]/[month]/[day]/page.tsx`, `app/[year]/[month]/[day]/[slug]/page.tsx`
- Existing CF Functions: `infra/infra.yml` (static HTML routing, apex redirect)
- Clarification: Phase 1 only — micro and tag optimizations deferred
