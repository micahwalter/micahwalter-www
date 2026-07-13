# Issue #100 — Requirements

**GitHub Issue:** [#100 — Add a recent photos section to the homepage](https://github.com/micahwalter/micahwalter-www/issues/100)
**Branch:** `claude/ai-dlc-implementation-plan-2ltytn`

## Intent Analysis

| Field | Value |
|-------|-------|
| **User request** | "Add a recent photos section to the homepage. Below the recent posts / grid style." |
| **Request type** | New homepage feature (content presentation) |
| **Scope estimate** | Single component — homepage (`app/page.tsx`) |
| **Complexity estimate** | Simple — data already available via `getPhotos()`; existing grid/photo-card patterns to reuse |

## Current State (Reverse Engineering Reuse)

- `app/page.tsx` renders a hero (`getFeaturedPhoto()`) followed by a **Recent Posts** section styled as a vertical list (`<ul>`/`<li>`, not a grid) of the 5 most recent blog posts (`getBlogPosts().slice(0, 5)`), linking to `/posts`.
- `lib/content.ts` already exposes `getPhotos()` (all photo-type posts, newest first) and `getFeaturedPhoto()` (newest `featured: true` photo, falling back to newest photo overall).
- `/photos` (`app/photos/page.tsx`) lists all photos via `PaginatedPostGrid` → `PhotoCard`, a content-rich card (image, category badge, EXIF overlay, excerpt, tags) laid out in a `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3` grid.
- `PostGrid` (non-paginated variant of the same grid) exists and is used on category/tag pages.

## Problem Statement

The homepage highlights one photo (hero) and a list of recent blog posts, but gives no visibility into recent photography beyond that single hero image. The issue asks for a new **Recent Photos** section, placed below Recent Posts, that presents multiple recent photos in a **grid** layout (as opposed to the list layout used for Recent Posts).

## Functional Requirements

### FR-1: Recent Photos section on homepage

Add a new section to `app/page.tsx`, positioned below the existing "Recent Posts" section, titled "Recent Photos".

### FR-2: Data source

Populate the section from `getPhotos()` (already sorted newest-first), limited to a small count suitable for a homepage teaser (proposed: 6).

### FR-3: Avoid duplicating the hero photo

The homepage hero already displays `getFeaturedPhoto()`. If that photo would also appear in the Recent Photos grid, exclude it so the same photo isn't shown twice on the page.

### FR-4: Grid layout

Render photos in a CSS grid (not a list), consistent with the "grid style" the issue calls for. Two options were considered — resolved in Design Decisions below.

### FR-5: Link to full photo archive

Include a "View all photos →" link to `/photos`, matching the pattern already used for "View all posts →".

### FR-6: Empty state

If there are no photos (or none remain after excluding the hero), skip rendering the section entirely (mirrors the existing `recentPosts.length > 0` guard).

## Design Decisions — APPROVED (2026-07-13)

1. **Card density** — **Compact thumbnail grid**: image-only tiles (no excerpt/tags/EXIF), matching the lightweight treatment already used for Recent Posts above it. (`PhotoCard` reuse was considered and rejected as too heavy for a homepage teaser.)

2. **Photo count** — **6 photos** (2 rows at 3-column desktop width).

## Non-Functional Requirements

### NFR-1: Static export compatibility

No new dynamic APIs; purely build-time data via existing `lib/content.ts` helpers. Compatible with `output: "export"`.

### NFR-2: Responsive layout

Grid must degrade gracefully on mobile (single column) consistent with existing grid breakpoints (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3` or a simpler 2/3-col variant for thumbnails).

### NFR-3: Build correctness

`npm run build` must succeed (primary validation signal for this repo; no test runner configured).

## Out of Scope

| Item | Reason |
|------|--------|
| Changes to `/photos` page itself | Not requested; homepage-only addition |
| New reusable "compact photo tile" component beyond what's needed here | Avoid premature abstraction; inline in `app/page.tsx` unless reuse emerges |
| Pagination/"load more" on the homepage section | Teaser section only; full browsing lives at `/photos` |

## Acceptance Criteria

- [ ] Homepage shows a "Recent Photos" section below "Recent Posts"
- [ ] Section renders as a CSS grid, not a list
- [ ] Section pulls from `getPhotos()`, most recent first, capped at the agreed count
- [ ] Hero photo (`getFeaturedPhoto()`) is not duplicated in the grid
- [ ] "View all photos →" link present, points to `/photos`
- [ ] Section is omitted cleanly when there are no eligible photos
- [ ] `npm run build` passes

## Extension Compliance

| Extension | Status | Rationale |
|-----------|--------|-----------|
| Security Baseline | N/A | No auth, data, or new endpoints |
| Resiliency Baseline | N/A | No infrastructure changes |
| Property-Based Testing | N/A | No test runner configured |
