# Unit ↔ Story Map — Issues #103 / #104

**Stories source**: `aidlc-docs/inception/user-stories/issue-103-stories.md`  
**Coverage target**: US-001 … US-016 — all assigned

---

## Map by unit

| Unit | Stories | Notes |
|------|---------|-------|
| **U1 Photo data plane** | US-002 | Persist to DynamoDB; no git commit; API readable |
| **U2 Enrichment** | US-003, US-004 | Bedrock tags; GPS fuzz + Location city/country tags |
| **U3 Upload UI** | US-001 | Multi-file + per-file title/caption/featured |
| **U4 Browse & detail** | US-007, US-008, US-009, US-010 | Live API browse/detail/search; `/photos/<id>`; redirects |
| **U5 Edit UI** | US-005 | Auth edit + detail shortcut |
| **U6 Galleries** | US-011, US-012 | Admin UI + public galleries + markdown migrate |
| **U7 Cutover** | US-006, US-013, US-014, US-015, US-016 | CLI; migrate photos; cleanup; feeds job; multi-region |

---

## Map by story

| Story | Title (short) | Unit |
|-------|---------------|------|
| US-001 | Multi-file upload metadata | U3 |
| US-002 | Persist without git commit | U1 |
| US-003 | Auto AI tags | U2 |
| US-004 | GPS enrichment / fuzz / city-country tags | U2 |
| US-005 | Authenticated edit UI | U5 |
| US-006 | CLI import/tag against API | U7 |
| US-007 | Browse from live API | U4 |
| US-008 | Detail `/photos/<id>` | U4 |
| US-009 | Legacy redirects | U4 |
| US-010 | Live search photos | U4 |
| US-011 | Gallery admin UI | U6 |
| US-012 | Public galleries from DB | U6 |
| US-013 | Migrate existing photos | U7 |
| US-014 | Stop markdown + clean content tree | U7 |
| US-015 | Scheduled RSS/sitemap | U7 |
| US-016 | Multi-region parity | U7 |

---

## Coverage check

| Check | Status |
|-------|--------|
| All 16 stories assigned | Yes |
| No story in two units | Yes |
| FR-1…11 touched via story→unit chain | Yes (via requirements traceability in stories) |
| Journey order respected | Yes (publish → enrich → browse → edit → galleries → cutover) |
