# Issue #93 — Requirements

**GitHub Issue:** [#93 — Fathom analytics double-counts legacy date URLs and permalink URLs](https://github.com/micahwalter/micahwalter-www/issues/93)  
**Branch:** `cursor/fathom-canonical-urls-000b`

## Intent Analysis

| Field | Value |
|-------|-------|
| **User request** | Document and fix misleading Fathom pageview counts where legacy date-based post URLs and canonical permalinks appear as separate hits for the same visit |
| **Request type** | Bug fix / enhancement (analytics accuracy) |
| **Scope estimate** | Single component — Fathom client + shared URL helper |
| **Complexity estimate** | Simple — pattern-matching mirrors existing CloudFront redirect logic |

## Problem Statement

Fathom Analytics records pageviews for **both** legacy date-based URLs (e.g. `/2024/01/my-post-slug`) and canonical permalinks (`/posts/my-post-slug`) when a visitor enters via a legacy link.

**Historical root cause:** Before PR #91, ~1,150 Next.js static redirect pages loaded the full app layout (including Fathom) before client-side redirect to `/posts/[slug]`, producing two pageviews per visit.

**Partial fix deployed:** PR #91 added CloudFront 301 redirects at the edge so legacy URLs no longer serve HTML. New production visits via legacy paths should only record the permalink pageview after the browser follows the redirect.

**Remaining gap:** `components/Fathom.tsx` tracks raw `usePathname()` with no canonical normalization. Any environment or edge case where legacy HTML loads (dev without CloudFront, stale S3 artifacts, future regressions) would still double-count. Fathom also lacks defense-in-depth aggregation under canonical paths.

## Functional Requirements

### FR-1: Canonical Fathom page path

When Fathom records a pageview, normalize legacy post URL patterns to `/posts/[slug]` before calling `trackPageview()`.

**Patterns to normalize** (must match `StaticHTMLRoutingFunction` in `infra/infra.yml`):

| Pattern | Example | Canonical |
|---------|---------|-----------|
| `/YYYY/MM/DD/slug` | `/2024/01/28/my-post` | `/posts/my-post` |
| `/YYYY/MM/slug` | `/2024/01/my-post` | `/posts/my-post` |
| `/YYYY/slug` | `/2024/my-post` | `/posts/my-post` |
| `/slug` | `/my-post` | `/posts/my-post` |

**Must NOT normalize** (real archive pages):

| Pattern | Example |
|---------|---------|
| `/YYYY` | `/2024` |
| `/YYYY/MM` | `/2024/01` |

**Reserved root segments** (must NOT normalize to `/posts/...`):  
`about`, `colophon`, `emails`, `galleries`, `micro`, `newsletter`, `photos`, `posts`, `sketches`, `upload`, `tags`, `topics`, `page`

### FR-2: Shared redirect logic

Extract normalization into a reusable module (`lib/fathom-url.ts`) with comments referencing the CloudFront function so future redirect rule changes stay in sync.

### FR-3: Documentation

Record investigation findings, implementation, and verification steps in AI-DLC construction artifacts.

## Non-Functional Requirements

### NFR-1: No user-visible behavior change

Analytics-only change; no layout, routing, or SEO changes required in this engagement.

### NFR-2: Zero additional network requests

Normalization is client-side string matching only.

### NFR-3: Build correctness

`npm run build` must succeed (primary validation signal for this repo).

## Out of Scope

| Item | Reason |
|------|--------|
| Fathom historical data merge | Fathom product limitation; historical duplicates remain |
| S3 cleanup of orphaned redirect HTML | Low priority; CloudFront intercepts first (#93 optional item) |
| Post page `<link rel="canonical">` metadata | Nice-to-have SEO; not required for Fathom fix |
| CloudFront redirect changes | Already deployed in #90/#91 |

## Acceptance Criteria

- [ ] `toFathomPagePath()` normalizes all four legacy patterns to `/posts/[slug]`
- [ ] Year and month archive paths are unchanged
- [ ] `components/Fathom.tsx` uses canonical path for `trackPageview()`
- [ ] `npm run build` passes
- [ ] AI-DLC construction summary documents verification approach

## Extension Compliance

| Extension | Status | Rationale |
|-----------|--------|-----------|
| Security Baseline | N/A | No auth, data, or new endpoints |
| Resiliency Baseline | N/A | No infrastructure changes |
| Property-Based Testing | N/A | No test runner configured |
