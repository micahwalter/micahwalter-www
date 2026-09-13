# Build and Test — Issue #153 Photo AI Tags Fix

## Unit tests

```bash
cd infra/photo-upload-lambdas && node --test src/lib/*.test.js
```

Result (2026-09-13): **25 passed**, 0 failed (includes new `bedrock-tags.test.js`).

## Live verification (production)

1. Applied widened EnrichFn Bedrock IAM (matches `infra/photo-upload.yml` change).
2. Force re-enriched sparse ids via:
   ```bash
   aws lambda invoke --function-name photo-upload-enrich \
     --cli-binary-format raw-in-base64-out \
     --payload '{"detail":{"photoId":"<id>","force":true}}' /tmp/out.json
   ```
3. Confirmed `bedrockOk: true` / `tagCount: 11` in CloudWatch and rich tags via API.

Evidence:
- `/opt/cursor/artifacts/issue-153-backfill-tags.log`
- `/opt/cursor/artifacts/issue-153-enrich-success.log`

## Deploy after merge

Pushing/merging this branch runs `photo-upload-deploy.yml` (template + Lambda zip) so CFN retains the IAM fix and ships logging/parse improvements.

## Success criteria checklist

- [x] CloudWatch `bedrockOk: true` after fix
- [x] API shows non-geo AI tags on test/backfill ids
- [x] Sparse ids 171, 174–181 backfilled
- [x] Soft-fail `complete` retained; richer logs in code (ship on deploy)
- [ ] Close #153 after PR merge (human)
