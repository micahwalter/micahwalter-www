# U7 Cutover Runbook

Ordered operator checklist after merging this branch / deploying stacks.

## 1. Deploy infra

1. Redeploy `micahwalter-www-github-actions` if IAM changed (secondary + feed rule + secret replicate).
2. Deploy primary `micahwalter-photo-upload` (template change: FeedPublisher, secret ReplicaRegions, WebsiteBucketName).
3. Confirm secret replica exists in us-east-2 (`photo-upload-secrets`).
4. Deploy `micahwalter-photo-upload-secondary` (workflow_dispatch or push path).
5. Confirm ApiMapping `photos` on secondary `api.micahwalter.com`.
6. Site deploy for CLI/scripts (normal `deploy.yml`).

## 2. Migrate galleries (if not done in U6)

```bash
node scripts/migrate-galleries.js
node scripts/migrate-galleries.js --apply
```

## 3. Migrate photos

```bash
node scripts/migrate-photos.js
node scripts/migrate-photos.js --apply
# optional GPS backfill from S3 originals:
node scripts/migrate-photos.js --apply --gps
```

Verify:

- `GET https://api.micahwalter.com/photos/featured`
- `GET https://api.micahwalter.com/photos/<id>` for a few ids
- Homepage / `/photos` / search in browser

## 4. Feeds

- Wait for hourly schedule or invoke `photo-upload-feed-publisher` once.
- Check `https://www.micahwalter.com/photos-feed.xml` and `sitemap-photos.xml`.

## 5. CLI smoke

```bash
blog photos:import ./sample --dry-run
blog photos:tag <id> --dry-run --profile www
```

## 6. Content cleanup (destructive)

Only after API verify:

```bash
node scripts/cleanup-photo-content.js
node scripts/cleanup-photo-content.js --apply --galleries
npm run build   # must succeed
git add content && git commit -m "chore: remove photo/gallery markdown after DynamoDB cutover"
```

## 7. Rollback notes

- Keep DDB rows; restore content from git if cleanup was premature.
- Disable EventBridge rule `photo-feed-publisher-hourly` if feed writes misbehave.
- Secondary stack can be deleted without deleting primary data.
