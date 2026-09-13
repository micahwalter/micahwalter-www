# Code Summary — U1 Photo AI Tags Fix (#153)

## Root cause

`photo-upload-enrich-fn-role` allowed `bedrock:InvokeModel` only on
`arn:aws:bedrock:us-east-1::foundation-model/*`. The inference profile
`us.anthropic.claude-sonnet-4-6` invokes
`arn:aws:bedrock:us-east-2::foundation-model/anthropic.claude-sonnet-4-6`,
so every enrich run soft-failed Bedrock (`bedrockOk: false`) and kept only
default + geo tags. See `diagnosis.md`.

## Modified (application)

| File | Change |
|------|--------|
| `infra/photo-upload.yml` | EnrichFn Bedrock IAM: add `arn:aws:bedrock:*::foundation-model/anthropic.*` |
| `infra/photo-upload-lambdas/src/lib/bedrock-tags.js` | `parseTagResponse()` (comma/newline/bullets); empty-parse warning with raw preview |
| `infra/photo-upload-lambdas/src/enrich.js` | Log `coverFound`, `geoTagCount`, `aiTagCount` on complete |
| `infra/photo-upload-lambdas/src/lib/bedrock-tags.test.js` | **Created** — parse/format unit tests |

## Ops already applied (live)

1. Widened live `EnrichFnPolicy` Bedrock resources to match the template fix
2. Force re-enriched sparse ids: **171, 174, 175, 176, 177, 178, 180, 181**
3. API confirms each now has ~11 tags including AI subject tags (`bedrockOk: true` in logs)

## Deploy still needed for code logging

IAM is live. Lambda **logging/parse** improvements ship when
`photo-upload-deploy.yml` runs after this branch merges (CFN will also
persist the IAM change so a later stack update does not revert it).

```bash
# After merge, workflow deploys automatically on infra/photo-upload* changes.
# Manual if needed:
cd infra/photo-upload-lambdas && make build
AWS_PROFILE=www aws s3 cp dist/photo-upload.zip \
  s3://micahwalter-newsletter-artifacts/photo-upload/lambda/photo-upload.zip
AWS_PROFILE=www aws cloudformation deploy \
  --stack-name micahwalter-photo-upload \
  --template-file infra/photo-upload.yml \
  --region us-east-1 --capabilities CAPABILITY_NAMED_IAM
```

## Tests

```bash
cd infra/photo-upload-lambdas && node --test src/lib/*.test.js
# 25 passed (2026-09-13)
```

## Out of scope (unchanged)

- `coverImageKey` pointing at missing `photo.jpeg` (display uses sized variants)
- Full catalog retag beyond listed sparse ids
