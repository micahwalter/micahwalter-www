# U4 — NFR Design Patterns

**Decisions**: Q1–Q6=A (derived from approved NFR Requirements / FD / issue-90)

---

## Resilience

### Manual Retry + soft map fail
- Photo fetches (featured/list/get): on failure show message + **Retry** control; **no** automatic multi-retry loops (Q1=A).
- Static map `<img>` `onError` → unmount/hide map section (NFR-U4-R2).
- 404 on detail → not-found UI; do not fall back to markdown photos.
- CloudFront redirect is synchronous 301; non-matching URIs pass through unchanged (NFR-U4-R4).

## Scalability

### Bounded client prefetch + cursor list
- SearchBar: walk list API with `limit` up to **50**, max **~2 pages** (~100 items), then stop (Q2=A / NFR-U4-S2).
- `/photos` grid: page size **12**, Load more via cursor (unbounded over time, user-driven).
- No new caches, queues, or CDN layers on the photo API in U4.

## Performance

### Parallel homepage reads
- On homepage mount: `Promise.all([getFeaturedPhoto(), listPhotos({ limit })])` then derive recent excluding featured id (Q3=A).
- Search: one prefetch per open; filter in memory on keystrokes (no per-keystroke API).
- No session-level shared cache across routes (NFR Q6=A).

## Security

### Public DTO trust boundary
- Render only PublicPhotoDTO fields; never precise GPS (Q4=A).
- Map URL built solely from `publicLatitude` / `publicLongitude`.
- Public pages carry **no** auth tokens; Edit stub does not call PATCH (U5).
- CORS remains as configured on photo API (`www` + localhost).

## Cross-cutting

| Pattern | Applied |
|---------|---------|
| Client islands | Small `"use client"` components fetch API; static shells elsewhere |
| Static export placeholder | `generateStaticParams` returns placeholder; client loads real id |
| Redirect merge | Extend existing viewer-request Function (one function per behavior) |
| CQRS-lite (consume) | Read-only use of U1 PhotoQueryService HTTP surface |

---

## Explicitly not applied in U4

| Pattern | Reason |
|---------|--------|
| Auto-retry / circuit breaker | Personal traffic; manual Retry sufficient |
| React Query / SWR cache layer | NFR: no special client cache |
| Backend search index | Prefetch + filter |
| Separate CF Function for redirects | One viewer-request Function limit (issue-90) |
