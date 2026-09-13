# Diagnosis — Issue #153 Sparse AI Photo Tags

**Date**: 2026-09-13  
**Environment**: AWS profile `www`, account `461736191489`, region `us-east-1`  
**Log group**: `/aws/lambda/photo-upload-enrich`

## Root cause (confirmed)

`photo-upload-enrich-fn-role` is **not authorized** to invoke the underlying foundation model used by the cross-region inference profile `us.anthropic.claude-sonnet-4-6`.

CloudWatch (every sparse upload checked):

```text
Bedrock tagging failed: User: .../photo-upload-enrich-fn-role/photo-upload-enrich
is not authorized to perform: bedrock:InvokeModel on resource:
arn:aws:bedrock:us-east-2::foundation-model/anthropic.claude-sonnet-4-6
because no identity-based policy allows the bedrock:InvokeModel action
```

Then soft-fail completes enrichment:

```json
{"msg":"enrich complete","photoId":"181","hasGps":true,"geoOk":true,"bedrockOk":false,"tagCount":3,"enrichmentStatus":"complete"}
```

`tagCount: 3` = default `photography` + city + country only.

## Why IAM fails

Live role policy allows only:

- `arn:aws:bedrock:us-east-1::foundation-model/*`
- `arn:aws:bedrock:us-east-1:461736191489:inference-profile/*`

The `us.*` inference profile invokes the model in **us-east-2** (`anthropic.claude-sonnet-4-6`). That ARN is outside the us-east-1-only foundation-model allow list.

Template source: `infra/photo-upload.yml` EnrichFnRole Bedrock statement uses `${AWS::Region}` only.

## Evidence by photoId

| photoId | bedrockOk | Same IAM error |
|---------|-----------|----------------|
| 171 | false | yes |
| 172 | false | yes (initial enrich; later AI tags likely CLI) |
| 174 | false | yes |
| 175 | false | yes |
| 176 | false | yes |
| 177 | false | yes |
| 178 | false | yes |
| 180 | false | yes |
| 181 | false | yes |

## Fix direction

1. Widen EnrichFn Bedrock IAM to include multi-region Anthropic foundation models used by the inference profile, e.g. `arn:aws:bedrock:*::foundation-model/anthropic.*` (keep inference-profile ARNs).
2. Redeploy photo-upload stack (CFN change).
3. Improve logging (aiTagCount / error already present; optional parse hardening still useful).
4. Force re-enrich backfill sparse ids after deploy.

## Not the cause

- Missing cover image (geo path works; Bedrock reaches InvokeModel)
- Tag UI display limits
- Response parsing (invoke never succeeds)
