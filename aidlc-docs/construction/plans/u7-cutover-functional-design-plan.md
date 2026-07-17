# Functional Design Plan — U7 Cutover

**Unit**: U7 Cutover  
**Depth**: Standard  
**Date**: 2026-07-17  
**Status**: Complete (locks derived — no new questions)

## Stories

US-006, US-013, US-014, US-015, US-016

## Derived locks (from Requirements / App Design / U1–U6)

| # | Lock | Source |
|---|------|--------|
| 1 | Full cutover this engagement | Req Q1 / FR-11 |
| 2 | Migrate ~43–44 photo markdown → DynamoDB; preserve stable numeric `id` | US-013, FR-1.4 |
| 3 | GPS backfill from S3 originals when EXIF present | US-013 |
| 4 | Migration idempotent / re-runnable | US-013, gallery migrator pattern |
| 5 | Dry-run default; `--apply` to write | U6 migrator pattern |
| 6 | Process already DDB-only; remove residual GitHub-commit path / dead code | FR-11.3, process.js |
| 7 | After verify: remove photo folders from `content/posts/`; keep blog/email | US-014 |
| 8 | Remove `content/galleries` markdown after U6 migrate verified | U6 deferral |
| 9 | CLI `photos:import` / `photos:tag` → API/DB; no photo `index.md` SoT | FR-10, US-006 |
| 10 | Gallery CLI optional (web admin is v1 path) | FR-10.3 |
| 11 | Scheduled job updates RSS/sitemap photo URLs; blog prebuild unchanged | FR-9, US-015 |
| 12 | Feed photo URLs use `/photos/<id>` | US-015 |
| 13 | Multi-region photo metadata/API parity with site posture | NFR-3, US-016 |
| 14 | Redirects `/posts/<digits>` already in U4 — verify coverage post-migrate | US-009 |
| 15 | No markdown hybrid fallback on photo surfaces | U4 BR-U4-02 |

## Steps

- [x] Analyze unit + stories
- [x] Lock decisions from prior artifacts (no re-ask)
- [x] Generate business-logic-model, business-rules, domain-entities, frontend-components (ops/CLI surfaces)
- [x] Present FD completion gate

## Explicit non-goals in FD (defer detail to NFR/Infra)

- Exact DynamoDB global table vs replica mechanism (NFR Design / Infra)
- EventBridge schedule cron expression (Infra)
- Bedrock model access ops (already U2)
