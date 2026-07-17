# U4 — Browse & detail — NFR Design Plan

**Inputs**: `u4-browse-detail/nfr-requirements/` (approved All A)  
**Goal**: Patterns + logical components (CF Function detail → Infrastructure Design)  
**Next after approval**: Infrastructure Design  

---

## Plan checklist

- [x] Collect answers (derived from prior NFR Requirements + FD + issue-90 CF pattern)
- [x] Resolve ambiguities
- [x] Generate `nfr-design-patterns.md`
- [x] Generate `logical-components.md`
- [x] Present NFR Design completion (Continue → Infrastructure Design)

---

## Locked answers (derived — no re-ask)

| Q | Answer | Source |
|---|--------|--------|
| 1 | **A** | NFR-U4-R1 manual Retry; no auto-retry specified |
| 2 | **A** | NFR-U4-S2 bounded ~100 prefetch |
| 3 | **A** | Default parallel homepage fetch (not previously contradicted) |
| 4 | **A** | NFR-U4-SEC1/SEC3 public DTO + no PATCH on stub |
| 5 | **A** | Issue #90 / existing `StaticHTMLRoutingFunction` merge pattern; FD Q4=A |
| 6 | **A** | NFR-U4-M1 + FD frontend-components minimal islands |

---
