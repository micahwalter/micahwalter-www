# U6 — Galleries — NFR Design Plan

**Inputs**: `u6-galleries/nfr-requirements/` (approved via derived locks)  
**Next after approval**: Infrastructure Design  

---

## Plan checklist

- [x] Collect answers (derived from U4/U1 NFR Design + U6 NFR Requirements)
- [x] Resolve ambiguities
- [x] Generate `nfr-design-patterns.md`
- [x] Generate `logical-components.md`
- [x] Present NFR Design completion (Continue → Infrastructure Design)

---

## Derived locks (no re-ask)

| Category | Decision |
|----------|----------|
| Resilience | Manual Retry on public/admin fetch failures; skip missing photo ids; no markdown fallback |
| Scalability | On-demand DDB + default Lambda concurrency; small gallery lists |
| Performance | Modest parallel photo GETs (3–5); no batch API; no session cache |
| Security | Public GET non-draft; HMAC on writes; least-privilege table IAM; no delete |
| Logical components | Minimal: GalleryStore, handlers in photos-api, DTO projector, hub panel, public islands, migrator |

---
