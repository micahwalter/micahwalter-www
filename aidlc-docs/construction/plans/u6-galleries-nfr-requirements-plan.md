# U6 — Galleries — NFR Requirements Plan

**Inputs**: `u6-galleries/functional-design/` (approved)  
**Next after approval**: NFR Design  

---

## Plan checklist

- [x] Collect answers (derived from U1 / App Design / FD)
- [x] Resolve ambiguities
- [x] Generate NFR artifacts
- [x] Present NFR Requirements completion (Continue → NFR Design)

---

## Locked answers (derived — no re-ask)

| Q | Answer | Source |
|---|--------|--------|
| 1 | **A** | App Design: own `galleries` DynamoDB table |
| 2 | **A** | Extend photo-upload / photos API surface (same zip) |
| 3 | **A** | Personal traffic / U1 best-effort; no batch API required |
| 4 | **A** | U1 NFR-U1-C1 — no API CDN cache |
| 5 | **A** | U1/U4 — logs only, no new alarms |
| 6 | **A** | FD idempotent upsert + dry-run; keep markdown (U7 cleanup) |

---
