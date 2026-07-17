# Code Generation Plan — U7 Cutover

**Unit**: U7 Cutover  
**Depth**: Standard  
**Date**: 2026-07-17  
**Status**: Part 2 complete — awaiting approval  
**Stories**: US-006, US-013, US-014, US-015, US-016  

## Preconditions

- [x] U1–U6 Code Generation complete
- [x] U7 FD / NFR / Infra Design approved

## Part 1 — Planning

- [x] Plan created and approved ("approved")

## Part 2 — Generation steps

### A. ProcessCommitRemover + secrets

- [x] A1. Remove dead `github.js`
- [x] A2. Stop documenting `githubToken` as required
- [x] A3. `ReplicaRegions: [us-east-2]` on photo-upload-secrets

### B. PhotoMigrator (US-013)

- [x] B1. `scripts/migrate-photos.js`
- [x] B2. Optional `--gps` backfill from S3
- [x] B3. Dry-run / `--apply`; exit non-zero on apply failures

### C. ContentCleanup (US-014)

- [x] C1. `scripts/cleanup-photo-content.js`
- [x] C2. Dry-run / `--apply`; `--galleries` optional
- [x] C3. Operator-run only (runbook)

### D. PhotosCLI (US-006)

- [x] D1. `import-photos.js` → DynamoDB (no index.md)
- [x] D2. `tag-photos.js` → DynamoDB by id / `--all`
- [x] D3. CLI help updated
- [x] D4. Image stage + optimize/sync path retained

### E. FeedPublisher (US-015)

- [x] E1. `src/feed-publisher.js`
- [x] E2. CFN function/role/schedule/env
- [x] E3. `photos-feed.xml` + `sitemap-photos.xml`
- [x] E4. Blog prebuild feeds unchanged
- [x] E5. Website bucket param + GHA function update list

### F. PhotoUploadSecondary (US-016)

- [x] F1. `infra/photo-upload-secondary.yml`
- [x] F2. `photo-upload-secondary-deploy.yml`
- [x] F3. `github-actions-role.yml` secondary + replicate + feed rule
- [x] F4. Auth + photos-api only; process/enrich primary-only

### G. Docs / verify

- [x] G1. `code-summary.md`
- [x] G2. `cutover-runbook.md`
- [x] G3. CLI help (minimal)
- [x] G4. `npm run build`
- [x] G5. Plan + state + audit

## Explicit non-goals

- No DynamoDB global tables
- No Bedrock/process in us-east-2
- No gallery CLI / SNS alarms / image re-key
- No automatic migrate/cleanup in CI
