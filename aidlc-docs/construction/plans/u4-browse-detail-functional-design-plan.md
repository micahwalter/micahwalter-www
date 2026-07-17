# U4 — Browse & detail — Functional Design Plan

**Unit**: U4 Browse & detail  
**Stories**: US-007, US-008, US-009, US-010  
**Components**: PhotoPublicUI, RedirectLayer, extend `lib/photos-api.ts`  
**Construction**: FD → NFR (client fetch) → Infrastructure (CF redirects) → Code Generation  

---

## Plan checklist

- [x] Collect answers (locked from inception + remaining open)
- [x] Resolve ambiguities
- [x] Generate FD artifacts
- [x] Present Functional Design completion (Continue → NFR Requirements)

---

## Locked answers

| Q | Answer | Notes |
|---|--------|-------|
| 1 | **A** | Client fetch via `lib/photos-api.ts` (Req / App Design) |
| 2 | **A** | API-only photo surfaces until U7 migration (user 2026-07-17) |
| 3 | **B** | OSM / staticmap-style URL (user 2026-07-17) |
| 4 | **A** | CloudFront Function redirects (user 2026-07-17) |
| 5 | **A** | Live search via photo API (Req Q10 / US-010) |
| 6 | **A** | Pagination ~12 / Load more (US-007) |
| 7 | **A** | Port detail + Edit shortcut stub (App Design) |
| 8 | **A** | Featured endpoint + recent excludes hero (US-007) |

### Question 2

[Answer]: A

### Question 3

[Answer]: B

### Question 4

[Answer]: A

---
