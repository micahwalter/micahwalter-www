# U4 — Business Logic Model (Browse & detail)

**Stories**: US-007, US-008, US-009, US-010  
**Decisions**: Client fetch + `lib/photos-api.ts`; API-only (no markdown merge); OSM static map; CF Function redirects; live search; page size 12; featured endpoint; detail port + Edit stub for U5.

---

## Data flow (text)

```
Visitor browser
  -> static HTML shell (S3/CloudFront)
  -> client island fetches api.micahwalter.com/photos
       GET /featured
       GET /           (cursor, limit=12)
       GET /{id}
       (search: list or dedicated query if available; else client filter on fetched pages / list)
  -> render hero / grid / detail / search hits

Legacy bookmark /posts/123
  -> CloudFront Function
  -> 301 Location: /photos/123
  -> detail client fetch GET /photos/123
```

---

## Flows

### F1 — Homepage hero + recent (US-007)

1. Client calls `getFeaturedPhoto()` → `GET /photos/featured`.
2. Client calls `listPhotos({ limit })` → `GET /photos/?limit=…`.
3. Build recent strip: list items whose `id` ≠ featured `id`, take N for homepage.
4. Links point to `/photos/<id>`.
5. On API failure: empty/error state for photo sections only; blog recent posts unchanged.

### F2 — `/photos` grid (US-007)

1. Initial load: `listPhotos({ limit: 12 })`.
2. Render grid (reuse visual language of existing photo grid / cards).
3. Load more: pass `nextCursor` until null.
4. Empty list (pre-migration): empty-state copy (no markdown fallback).

### F3 — Detail `/photos/[id]` (US-008)

1. Client reads `id` from route; `getPhoto(id)`.
2. 404 → not-found UI.
3. Render: image, title, date, caption, tags, EXIF panel when data present.
4. If `publicLatitude` and `publicLongitude` set → build OSM static map URL → `<img>` (and optional external map link).
5. Else omit map section entirely.
6. Edit shortcut: placeholder for U5 (hub editor); no PATCH in U4.

### F4 — Legacy redirect (US-009)

1. CloudFront Function on viewer-request (or equivalent existing CF redirect mechanism).
2. If path matches `/posts/<digits>` → 301 to `/photos/<digits>`.
3. Otherwise pass through (blog slug pages continue to S3 origin).

Note: Distinguishing “is this id a photo?” may be best-effort (all-numeric under `/posts/` historically used for photos). Blog posts use title slugs, not bare numeric ids — so numeric-only match is the rule.

### F5 — Live search (US-010)

1. Existing search UI keeps markdown/`posts.json` blog hits.
2. Additionally query photo API (list with client-side filter on title/caption/tags, or server search if endpoint exists in U1 — prefer API support if present; otherwise fetch recent pages / dedicated search endpoint added only if needed in Code Gen).
3. Merge and display photo hits with `href=/photos/<id>`.
4. New uploads discoverable without site rebuild.

### F6 — Static map URL builder

Input: `publicLatitude`, `publicLongitude`, optional zoom/size.  
Output: HTTPS URL to an OSM-based static map image service.  
No API key in build env for U4. Soft-fail: if URL/image fails, hide map (same as no geo).

---

## Out of scope for U4

- Markdown photo migration (U7)
- Full authenticated edit UI (U5)
- Gallery public pages (U6)
- RSS/sitemap scheduled job (U7)
- Dual-write / markdown fallback on browse
