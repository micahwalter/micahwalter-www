# Construction Summary — Issue #93: Fathom Canonical URL Tracking

**GitHub Issue:** [#93](https://github.com/micahwalter/micahwalter-www/issues/93)  
**Branch:** `cursor/fathom-canonical-urls-000b`

## Changes Implemented

### 1. `lib/fathom-url.ts` (new)

Added `toFathomPagePath()` — client-side normalization that mirrors the CloudFront `StaticHTMLRoutingFunction` legacy redirect rules in `infra/infra.yml`:

- `/YYYY/MM/DD/slug` → `/posts/slug`
- `/YYYY/MM/slug` → `/posts/slug`
- `/YYYY/slug` → `/posts/slug`
- `/slug` → `/posts/slug` (excluding reserved root segments)

Year archives (`/YYYY`) and month archives (`/YYYY/MM`) are left unchanged.

### 2. `components/Fathom.tsx`

Updated `trackPageview()` to report the canonical path from `toFathomPagePath()` instead of raw `usePathname()`. Also fixed query-string formatting (prepend `?` when search params are present).

## How This Addresses the Issue

| Layer | Behavior |
|-------|----------|
| **CloudFront (PR #91)** | Production legacy URLs return 301 before HTML loads — Fathom never runs on date paths |
| **Fathom canonical (this PR)** | Defense in depth — if HTML ever loads on a legacy path (dev, regression, stale artifact), pageviews aggregate under `/posts/[slug]` |

Historical Fathom data from before PR #91 will still show duplicate paths; this change prevents new duplicates from any code path that serves HTML on legacy URLs.

## Verification

### Automated

- [x] `npm run build` — passed

### Manual spot-check (`toFathomPagePath`)

| Input | Output |
|-------|--------|
| `/2024/01/my-post` | `/posts/my-post` |
| `/2024/01/28/my-post` | `/posts/my-post` |
| `/2024/my-post` | `/posts/my-post` |
| `/my-post` | `/posts/my-post` |
| `/2024` | `/2024` |
| `/2024/01` | `/2024/01` |
| `/posts/my-post` | `/posts/my-post` |
| `/about` | `/about` |

### Production redirect (pre-existing, unchanged)

```bash
curl -sI https://www.micahwalter.com/2024/01/add-fathom-analytics-to-your-obsidian-publish-site
# → 301 location: /posts/add-fathom-analytics-to-your-obsidian-publish-site
```

## Extension Compliance

| Extension | Status |
|-----------|--------|
| Security Baseline | N/A |
| Resiliency Baseline | N/A |
| Property-Based Testing | N/A |

## Post-Merge

Site redeploy via normal `main` push will bake the updated Fathom client into the static build. No infra changes required.

Fixes #93
