# U2 Code Summary — Enrichment

**Stories**: US-003, US-004  
**Branch**: `cursor/u2-enrichment-functional-design-be02`

## What changed

### Lambda package (`infra/photo-upload-lambdas/`)
- `src/enrich.js` — EventBridge worker
- `src/lib/geo.js`, `tag-merge.js`, `image-keys.js`, `location.js`, `bedrock-tags.js`
- `exif.js` — `extractGps`
- `photos-db.js` — `updatePhotoEnrichment`
- `photo-dto.js` — `city` / `country`
- Deps: `@aws-sdk/client-bedrock-runtime`, `@aws-sdk/client-location`

### CloudFormation (`infra/photo-upload.yml`)
- `EnrichFn` / `EnrichFnRole` (60s / 1024 MB)
- EventBridge rule `photo-pending-enrichment` + Lambda permission
- Archive `photo-bus-archive` (14 days)
- Place Index `micahwalter-photos-place-index` (Esri)

### CI
- `GitHubActionsDeployPhotoUpload` — rules/targets/archive + Place Index
- Workflow code-only path updates `photo-upload-enrich`

## Deploy order

1. Redeploy IAM stack `micahwalter-www-github-actions` (manual).
2. Enable Bedrock model access for `us.anthropic.claude-sonnet-4-6` in us-east-1.
3. Merge / run `photo-upload-deploy.yml` (template changed → full CFN).

## Smoke checklist (after deploy)

- [ ] Upload a photo with GPS EXIF → DynamoDB gets `publicLatitude`/`city`/`country`/tags; `enrichmentStatus=complete`
- [ ] Upload without GPS → Bedrock tags still applied; geo fields null; status `complete`
- [ ] `GET https://api.micahwalter.com/photos/{id}` shows `city`/`country`/public coords (no precise lat/lon)
- [ ] Re-deliver EventBridge event for already-complete photo → no-op
- [ ] Confirm archive `photo-bus-archive` exists (14-day retention)

## Known limits

- No enricher SQS DLQ (archive/replay only)
- Bedrock soft-fail leaves photo complete without AI tags
- Cover resolution prefers `photo-1200.jpg` then `.webp`
