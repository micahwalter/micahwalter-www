# Build Instructions — Issue #127 Exposure

## Prerequisites

- Node.js 20+
- npm
- AWS CLI v2 + SSO profile `www` (for Lambda zip upload / stack deploy)
- `make` (photo-upload Lambda package)

## Environment

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_PHOTO_API_URL` | e.g. `https://api.micahwalter.com/photos` (also derives `/exposures`) |
| `NEXT_PUBLIC_EXPOSURES_API_URL` | Optional override for exposures API |
| AWS profile `www` | Deploy photo-upload stack |

## Build steps

### 1. Site dependencies

```bash
cd /workspace   # or repo root
npm install
```

### 2. Typecheck / production build (site)

```bash
npx tsc --noEmit -p .
npm run build
```

- **Expected**: Next.js static export succeeds (`out/`)
- **Note**: `prebuild` may fetch Mastodon; failure is non-fatal

### 3. Photo-upload Lambda zip

```bash
cd infra/photo-upload-lambdas
make build
# → dist/photo-upload.zip (linux/arm64 sharp)
```

### 4. Upload artifact + deploy stack

```bash
AWS_PROFILE=www aws s3 cp dist/photo-upload.zip \
  s3://micahwalter-newsletter-artifacts/photo-upload/lambda/photo-upload.zip

AWS_PROFILE=www aws cloudformation deploy \
  --stack-name micahwalter-photo-upload \
  --template-file infra/photo-upload.yml \
  --region us-east-1 \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    AdminEmail=micah@micahwalter.com
```

Or rely on `.github/workflows/photo-upload-deploy.yml` after merge to `main`.

### 5. Site deploy

Push/merge so `deploy.yml` builds with `NEXT_PUBLIC_PHOTO_API_URL` set. Optionally set `NEXT_PUBLIC_EXPOSURES_API_URL=https://api.micahwalter.com/exposures`.

## Verify build success

- [ ] `npm run build` exit 0
- [ ] `dist/photo-upload.zip` exists after `make build`
- [ ] CFN deploy COMPLETE (ExposuresTable, ExposuresApi mapping, ExposureOrchestratorFn, ExposureSundaySchedule)
- [ ] `GET https://api.micahwalter.com/exposures/` returns JSON
- [ ] `GET https://api.micahwalter.com/photos/` still works

## Troubleshooting

| Issue | Fix |
|-------|-----|
| ApiMapping `exposures` conflict | Ensure key unused on `api.micahwalter.com` domain |
| SES empty-pool / From denied | Verify `AdminEmail` identity in SES |
| Scheduler invoke denied | Check `ExposureSchedulerRole` → Lambda invoke |
| sharp wrong arch | Always `make build` (forces linux/arm64) |
