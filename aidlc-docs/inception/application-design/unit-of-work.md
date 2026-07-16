# Units of Work — Issues #103 / #104

**Decomposition**: 7 journey-aligned units, strict sequential, no dual-write, each unit deployable/demoable  
**Plan**: `aidlc-docs/inception/plans/issue-103-unit-of-work-plan.md`  
**Application design**: `aidlc-docs/inception/application-design/`

---

## U1 — Photo data plane

| | |
|--|--|
| **Type** | Service / Module (API + persistence + process write path) |
| **Responsibility** | DynamoDB `photos` table; public read + authenticated write APIs on `api.micahwalter.com/photos`; process Lambda persists to DynamoDB and **does not** commit GitHub markdown |
| **Components** | PhotoRepository, PhotoCommandService, PhotoQueryService, UploadProcessPipeline (persist path), Auth |
| **Deliverable / demo** | Create/get/list/featured via API; process path writes a pending photo record without markdown |
| **Stories** | US-002 (foundation) |
| **Construction** | Functional Design, NFR, Infrastructure Design, Code Generation |

---

## U2 — Enrichment

| | |
|--|--|
| **Type** | Service (async worker) |
| **Responsibility** | SQS/EventBridge enricher: GPS fuzz, AWS Location reverse geocode → city/country tags, Bedrock vision tags; update photo enrichment status |
| **Components** | EnrichmentService, PhotoRepository; Bedrock; AWS Location |
| **Deliverable / demo** | Pending photo becomes enriched (tags + public geo fields) without blocking upload ACK |
| **Stories** | US-003, US-004 |
| **Depends on** | U1 |
| **Construction** | Functional Design, NFR, Infrastructure Design, Code Generation |

---

## U3 — Upload UI

| | |
|--|--|
| **Type** | Module (Next.js admin) |
| **Responsibility** | Multi-file `/upload` hub section: per-file title, caption, featured, progress; passcode auth; calls extended init/upload APIs |
| **Components** | PhotoAdminUI (upload), `lib/photos-api.ts` (upload helpers as needed) |
| **Deliverable / demo** | Owner uploads multiple photos with captions; records appear via U1 APIs |
| **Stories** | US-001 |
| **Depends on** | U1 (U2 optional for seeing tags later) |
| **Construction** | Functional Design (light), Code Generation; Infra N/A unless new env vars only |

---

## U4 — Browse & detail

| | |
|--|--|
| **Type** | Module (Next.js public) |
| **Responsibility** | `lib/photos-api.ts`; homepage hero/recent; `/photos`; `/photos/[id]` (caption, EXIF, static map port); live search; legacy redirects `/posts/<id>` → `/photos/<id>` |
| **Components** | PhotoPublicUI, RedirectLayer, photos-api client |
| **Deliverable / demo** | www shows API-backed photos at new URLs; old photo links redirect |
| **Stories** | US-007, US-008, US-009, US-010 |
| **Depends on** | U1 (enrichment fields graceful if missing) |
| **Construction** | Functional Design (map port), NFR (client fetch), Infrastructure Design (CF redirects), Code Generation |

---

## U5 — Edit UI

| | |
|--|--|
| **Type** | Module (Next.js admin) |
| **Responsibility** | Hub photo editor; authenticated Edit shortcut on `/photos/[id]`; update title/caption/tags/featured via API |
| **Components** | PhotoAdminUI (edit), PhotoCommandService (already in U1) |
| **Deliverable / demo** | Owner edits metadata; public pages reflect changes without deploy |
| **Stories** | US-005 |
| **Depends on** | U1, U3 (hub), U4 (detail shortcut) |
| **Construction** | Functional Design (light), Code Generation |

---

## U6 — Galleries

| | |
|--|--|
| **Type** | Service + Module |
| **Responsibility** | DynamoDB galleries; hub admin UI; public gallery pages; migrate `content/galleries` markdown |
| **Components** | GalleryRepository, GalleryAdminService, GalleryQueryService, PhotoAdminUI (galleries), PhotoPublicUI (galleries) |
| **Deliverable / demo** | Create gallery in hub; public gallery renders API photos |
| **Stories** | US-011, US-012 |
| **Depends on** | U1, U3, U4 |
| **Construction** | Functional Design, NFR, Infrastructure Design, Code Generation |

---

## U7 — Cutover

| | |
|--|--|
| **Type** | Cross-cutting cutover / ops |
| **Responsibility** | Migrate ~43 photos; content tree cleanup; feed scheduler; CLI parity; multi-region parity; verify no markdown photo source of truth |
| **Components** | Migration scripts, FeedPublisher, PhotosCLI, infra multi-region wiring |
| **Deliverable / demo** | Full site on DB photos; feeds update on schedule; CLI import/tag against API; photo folders removable |
| **Stories** | US-006, US-013, US-014, US-015, US-016 |
| **Depends on** | U1–U6 |
| **Construction** | Functional Design (migration rules), NFR, Infrastructure Design, Code Generation |

---

## Sequencing policy

1. Complete each unit (design → code → smoke/demo) before starting the next.  
2. No dual-write: from U1 onward, process writes DynamoDB only.  
3. Single owner approves each unit gate.
