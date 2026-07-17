# Code Generation Plan — U7 Cutover

**Unit**: U7 Cutover  
**Depth**: Standard  
**Date**: 2026-07-17  
**Status**: Part 1 — awaiting plan approval  
**Stories**: US-006, US-013, US-014, US-015, US-016  

## Preconditions

- [x] U1–U6 Code Generation complete (photos API, enrich, upload/edit hub, browse, galleries)
- [x] U7 FD / NFR / Infra Design approved
- [x] Design locks: full cutover; tickets-style secondary; feed job; migrator + cleanup; CLI→API

## Unit context

| Item | Value |
|------|-------|
| Deliverable | DB is photo SoT; CLI API-backed; scheduled photo feeds; us-east-2 API failover; content tree cleaned |
| Depends on | U1–U6 live APIs + tables |
| Owns | Migrator/cleanup scripts, CLI photo paths, FeedPublisher, photo-upload-secondary, process commit removal, runbook |
| Does not own | Image CRR/CF (exists); blog markdown prebuild |

---

## Part 1 — Planning

- [x] Plan created
- [ ] Plan approved by user → then Part 2

---

## Part 2 — Generation steps (execute only after approval)

### A. ProcessCommitRemover + secrets

- [ ] A1. Confirm `process.js` never commits markdown; remove dead `github.js` usage / file if unused
- [ ] A2. Stop requiring `githubToken` in process path docs/comments (`secrets.js` note)
- [ ] A3. Add `ReplicaRegions: [us-east-2]` to `photo-upload-secrets` in `photo-upload.yml`

### B. PhotoMigrator (US-013)

- [ ] B1. `scripts/migrate-photos.js` — scan `type: photo` posts; map frontmatter → PhotoRecord; upsert by `id`
- [ ] B2. Optional GPS backfill from S3 originals when EXIF present
- [ ] B3. Dry-run default; `--apply`; MigrationReport stdout; non-zero on apply failures

### C. ContentCleanup (US-014)

- [ ] C1. `scripts/cleanup-photo-content.js` — list/remove photo folders + gallery markdown
- [ ] C2. Dry-run default; `--apply`; never touch blog/email
- [ ] C3. Do **not** auto-delete in CI — operator runs after verify (document in runbook)

### D. PhotosCLI (US-006)

- [ ] D1. Update `scripts/import-photos.js` to create/upsert via photo API (no photo `index.md` as SoT)
- [ ] D2. Update `scripts/tag-photos.js` to retag DB-backed photos via API/enrichment path
- [ ] D3. Wire CLI help/examples in `cli/index.js` if flags change
- [ ] D4. Keep image optimize/S3 upload behavior compatible with CDN layout

### E. FeedPublisher (US-015)

- [ ] E1. Lambda handler `src/feed-publisher.js` (in photo-upload package)
- [ ] E2. CFN: function, role (DDB query + S3 put website bucket), EventBridge `rate(1 hour)`, env vars
- [ ] E3. Emit `photos-feed.xml` + `sitemap-photos.xml` (or agreed names) with `/photos/<id>` URLs
- [ ] E4. Leave blog `feed.xml` / main sitemap generation on prebuild; document dual-artifact approach
- [ ] E5. Website bucket name parameter + IAM; github-actions-role if needed for new resources

### F. PhotoUploadSecondary (US-016)

- [ ] F1. `infra/photo-upload-secondary.yml` — HTTP API, photos-api (+ auth), ApiMapping `photos`, cross-region DDB ARNs, secret name
- [ ] F2. Deploy workflow job or `photo-upload-secondary-deploy.yml` for us-east-2
- [ ] F3. Extend `infra/github-actions-role.yml` for secondary photo-upload CFN/Lambda/API
- [ ] F4. Minimum bar: public GET list/get + authenticated PATCH/gallery routes; process/enricher primary-only OK (document)

### G. Docs / verify

- [ ] G1. `aidlc-docs/construction/u7-cutover/code/code-summary.md`
- [ ] G2. `aidlc-docs/construction/u7-cutover/code/cutover-runbook.md` (ordered ops checklist)
- [ ] G3. Update CLAUDE.md / README snippets only where process/CLI/feeds changed (minimal)
- [ ] G4. `npm run build` with `NEXT_PUBLIC_PHOTO_API_URL` (site still builds post-script additions)
- [ ] G5. Plan checkboxes + state + audit

---

## Explicit non-goals (U7 Code Gen)

- No DynamoDB global tables (unless already trivial — stick to tickets pattern)
- No Bedrock/process pipeline in us-east-2 (document primary-only)
- No gallery CLI
- No new SNS alarms
- No image re-key
- No automatic production migrate/cleanup in CI

## Story coverage

| Story | Steps |
|-------|-------|
| US-013 Migrate photos | B |
| US-014 Cleanup markdown SoT | A, C |
| US-006 CLI API | D |
| US-015 Feeds job | E |
| US-016 Multi-region | A3, F |

## Approval

Approve this plan to begin Part 2 implementation.
