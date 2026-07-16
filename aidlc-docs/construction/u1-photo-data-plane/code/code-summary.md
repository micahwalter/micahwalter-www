# U1 Code Summary — Photo data plane

**Story**: US-002  
**Branch**: `cursor/photo-metadata-dynamodb-be02`

## What changed

### Lambda package (`infra/photo-upload-lambdas/`)
- Added `lib/photo-defaults.js`, `lib/photos-db.js`, `lib/photo-dto.js`
- Added `photos-api.js` — GET list/featured/{id}, PATCH {id}
- Rewrote `process.js` — DynamoDB put + EventBridge enrich event; **removed GitHub commit**
- Extended `init.js` — `caption` S3 metadata
- Dependencies: DynamoDB Document client, EventBridge client

### CloudFormation (`infra/photo-upload.yml`)
- Table `micahwalter-photos` + GSI1 + PITR
- Event bus `photo-bus`
- Process DLQ + `EventInvokeConfig` OnFailure
- `PhotosApiFn` + routes; CORS GET/PATCH; IAM updates
- Removed process env `GITHUB_*`

## Deploy

1. `cd infra/photo-upload-lambdas && make build`
2. Upload zip + `aws cloudformation deploy` stack `micahwalter-photo-upload` (or merge to `main` for `photo-upload-deploy.yml`)
3. Confirm secret has `passcode`, `hmac`, `ticketsPasscode`

## Smoke checklist (after deploy)

- [ ] `GET https://api.micahwalter.com/photos` → `{ items, cursor }`
- [ ] `GET .../photos/featured` → 404 until first photo or 200
- [ ] Upload via `/upload` (title only still OK) → row in DynamoDB, images on CDN, **no** new `content/posts` commit
- [ ] `GET .../photos/{id}` returns caption/title
- [ ] `PATCH .../photos/{id}` with valid token updates title
- [ ] Failed process events appear on `photo-upload-process-dlq` after retries
- [ ] EventBridge `photo-bus` receives `PhotoPendingEnrichment` (U2 will consume)

## Known U1 limits

- No enricher yet (tags/geo stay empty/pending)
- No IdempotencyGuard — rare S3 redrive after successful put could allocate a second id
- Frontend still filesystem-backed until U4
- `aws cloudformation validate-template` deferred here (no AWS credentials in agent); validate on deploy
