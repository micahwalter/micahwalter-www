# U7 — Cutover — NFR Design Plan

**Inputs**: `u7-cutover/nfr-requirements/` (approved)  
**Next after approval**: Infrastructure Design  

---

## Plan checklist

- [x] Collect answers (derived from NFR Requirements + tickets/images patterns)
- [x] Resolve ambiguities
- [x] Generate NFR design artifacts
- [x] Present NFR Design completion (Continue → Infrastructure Design)

---

## Locked answers (derived — no re-ask)

| Category | Lock | Source |
|----------|------|--------|
| Resilience | Idempotent migrate; dry-run; feed job soft-fail + next schedule; no markdown fallback | NFR-U7-R3–R5 |
| Scalability | On-demand DDB; default Lambda concurrency; personal traffic | NFR-U7-S1–S2 |
| Performance | Best-effort; modest migrator concurrency; paginated feed list; no API CDN cache | NFR-U7-P1–P4 |
| Security | HMAC for writes; DTO GPS strip; least-privilege secondary roles; secrets replica | NFR-U7-SEC* |
| Logical components | PhotoMigrator, ContentCleanup, PhotosCLI, FeedPublisher, PhotoUploadSecondary, AuthVerifier reuse | NFR tech stack |
| Multi-region | Secondary us-east-2 stack → primary DDB; api-domain failover; secrets ReplicaRegions | tickets pattern |
