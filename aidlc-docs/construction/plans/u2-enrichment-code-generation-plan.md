# U2 — Enrichment — Code Generation Plan

**Stories**: US-003, US-004  
**Design inputs**: `aidlc-docs/construction/u2-enrichment/{functional-design,nfr-requirements,nfr-design,infrastructure-design}/`  
**Code location**: workspace root — `infra/photo-upload-lambdas/`, `infra/photo-upload.yml`, `infra/github-actions-role.yml`, `.github/workflows/photo-upload-deploy.yml`  
**Approach**: Brownfield — add enricher Lambda + helpers; extend DTO/DB update; wire EventBridge rule/archive + Place Index  

This plan is the **single source of truth** for U2 Code Generation. Execute steps in order; mark `[x]` when complete.

---

## Unit context

| Item | Detail |
|------|--------|
| Deliverable | Async enricher: GPS from original, fuzz public coords, Location city/country, Bedrock tags, DynamoDB update, EventBridge rule+archive |
| Depends on | U1 photo record + `PhotoPendingEnrichment` on `photo-bus` |
| Enables | Richer U4 detail/map/tags; U5 edit of AI tags |

---

## Generation steps

### Step 1 — GPS / geo helpers
- [x] Extend or add EXIF GPS extraction (precise lat/lon from original bytes)
- [x] Add fuzz helper: round to 3 decimal places → public lat/lon
- [x] Add tag slug helper: lowercase hyphenated city/country strings
- [x] Files under `infra/photo-upload-lambdas/src/lib/` (e.g. extend `exif.js`, add `geo.js` / `tags.js`)

### Step 2 — Place reverse geocode client
- [x] AWS Location client: SearchPlaceIndexForPosition (or equivalent) against `PLACE_INDEX_NAME`
- [x] Map response → city (or region substitute) + country per FD
- [x] Soft-fail: return nulls on error; log without precise coords spam
- [x] File: e.g. `src/lib/location.js`
- [x] Dependency: `@aws-sdk/client-location` in package.json

### Step 3 — Bedrock tagger
- [x] Port prompt/parse intent from `scripts/tag-photos.js` (Converse vision, model from env default `us.anthropic.claude-sonnet-4-6`)
- [x] Input: optimized cover buffer (jpeg/webp format as required by Converse)
- [x] Soft-fail: return `[]` on error
- [x] File: e.g. `src/lib/bedrock-tags.js`
- [x] Dependency: `@aws-sdk/client-bedrock-runtime`

### Step 4 — Tag merge + cover key resolution
- [x] Union-merge tags (case-normalize, de-dupe); never remove existing
- [x] Resolve Bedrock image key: `photo-1200.jpg` → `photo-1200.webp` → coverImageKey fallbacks under folder
- [x] File: e.g. `src/lib/tag-merge.js`, `src/lib/image-keys.js`

### Step 5 — PhotoStore enrichment update
- [x] Extend `photos-db.js` with `updatePhotoEnrichment(id, fields)` allowing: latitude, longitude, publicLatitude, publicLongitude, city, country, tags, enrichmentStatus
- [x] Bump `updatedAt`

### Step 6 — Enrichment worker handler
- [x] Implement `src/enrich.js` handler for EventBridge events
- [x] Parse `photoId` from `detail`
- [x] Load photo; no-op if `enrichmentStatus === 'complete'`
- [x] Sequential: original→GPS → Location → cover→Bedrock → merge → update (`complete` or `failed` on hard update failure)
- [x] Log photoId + step flags (hasGps, geoOk, bedrockOk)

### Step 7 — Public DTO
- [x] Extend `photo-dto.js` with `city`, `country` (keep omitting precise GPS)

### Step 8 — CloudFormation
- [x] Add EnrichFn + EnrichFnRole (60s / 1024 MB, env vars)
- [x] Add EventBridge rule + Lambda permission + target
- [x] Add EventBridge archive (14 days) on `photo-bus`
- [x] Add Place Index `micahwalter-photos-place-index` (Esri)
- [x] IAM: S3 get images, DDB get/update, Bedrock invoke, Location search
- [x] File: `infra/photo-upload.yml`

### Step 9 — CI IAM + workflow
- [x] Extend `GitHubActionsDeployPhotoUpload` for enrich Lambda/role, rules/targets/archive, Place Index
- [x] Add `enrich` to code-only update loop in `photo-upload-deploy.yml`
- [x] Files: `infra/github-actions-role.yml`, `.github/workflows/photo-upload-deploy.yml`

### Step 10 — Package docs
- [x] Update `infra/photo-upload-lambdas/README.md` (enricher, Bedrock access prerequisite, archive replay)
- [x] Ensure Makefile zip includes new modules

### Step 11 — Construction code summary
- [x] Write `aidlc-docs/construction/u2-enrichment/code/code-summary.md` with deploy/smoke checklist
- [x] Note: redeploy github-actions IAM stack before CFN if needed; enable Bedrock model access

### Step 12 — Local verification
- [x] `npm install` / syntax require of new modules
- [x] Optional CFN validate if creds available
- [x] Do not require full AWS deploy unless user asks

---

## Out of scope

- Upload UI (U3), browse/detail (U4), edit UI (U5)
- CLI retag (later)
- Enricher SQS DLQ
- Multi-region

---

## Approval

Approve this plan to begin Part 2 execution (implementation).
