# Issue #90 — Construction Summary

**Branch:** `cursor/deploy-build-optimization-780e`  
**Date:** 2026-07-07

## Changes

### Unit 1: CloudFront legacy redirects (`infra/infra.yml`)

Extended `StaticHTMLRoutingFunction` with pattern-based 301 redirects to `/posts/[slug]` **before** static HTML routing:

| Pattern | Example | Destination |
|---------|---------|-------------|
| `/YYYY/MM/DD/slug` | `/2021/03/05/brooklyn-never-fuggedaboutit` | `/posts/brooklyn-never-fuggedaboutit` |
| `/YYYY/MM/slug` | `/2021/03/brooklyn-never-fuggedaboutit` | `/posts/brooklyn-never-fuggedaboutit` |
| `/YYYY/slug` | `/2024/my-post` | `/posts/my-post` |
| `/slug` | `/my-post` (not a reserved route) | `/posts/my-post` |

**Preserved (no redirect):** `/YYYY`, `/YYYY/MM`, reserved top-level routes (`about`, `posts`, `micro`, etc.)

**Deploy note:** Requires `infra/infra.yml` stack update via infra-deploy workflow (or manual CloudFormation deploy) **before** legacy URLs work in production after Next.js redirect pages are removed.

### Unit 2: Next.js route cleanup

- `app/[year]/page.tsx` — only generates year archives (removed 144 slug-as-year pages)
- `app/[year]/[month]/page.tsx` — only generates month archives (removed ~864 year×slug pages)
- Deleted redirect-only routes:
  - `app/[year]/[month]/[day]/page.tsx` (~144 pages)
  - `app/[year]/[month]/[day]/[slug]/page.tsx` (~144 pages)
- Removed unused helpers from `lib/content.ts`: `getAllSlugs`, `getAllPostDateSlugs`, `getAllPostYearMonthSlugs`

Dev-mode redirect fallbacks remain in `[year]` and `[year]/[month]` page components for local testing without CloudFront.

### Unit 3: CI cache and metrics (`.github/workflows/deploy.yml`)

- Cache `.next/cache` keyed on `package-lock.json` + TS/TSX sources
- Capture build duration and static page count from build log
- Capture S3 sync duration
- Write metrics table to GitHub Actions step summary

## Build verification

| Metric | Before (issue #90 baseline) | After (local) |
|--------|----------------------------:|--------------:|
| Static pages | ~2,295 | **~1,007** |
| Local build time | ~85s | **~31s** |

Page reduction: **~1,298 pages (~57%)**

## Redirect spot-check matrix (post-deploy)

After infra + site deploy, verify these return **301 → `/posts/...`**:

- [ ] `/2024/<blog-slug>` → `/posts/<blog-slug>`
- [ ] `/2021/03/<blog-slug>` → `/posts/<blog-slug>`
- [ ] `/2021/03/05/<blog-slug>` → `/posts/<blog-slug>`
- [ ] `/<blog-slug>` → `/posts/<blog-slug>`

Verify these **do NOT redirect**:

- [ ] `/2024` — year archive
- [ ] `/2024/03` — month archive
- [ ] `/about`, `/micro`, `/posts`, `/photos`

## Deploy sequence

1. Merge PR
2. Infra workflow deploys updated CloudFront Function (`infra/infra.yml` change)
3. Site deploy workflow runs with fewer pages + cached build
4. Validate CI metrics in Actions summary; target under 2 minutes total

## Closes

Fixes #90 (Phase 1 scope)
