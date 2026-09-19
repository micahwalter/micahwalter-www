# Photo Upload Lambdas

Backend for the web-based photo upload feature (`/upload`) and the photo
metadata API. Uploads are processed into the images CDN and **photo metadata is
stored in DynamoDB** (`micahwalter-photos`). The process Lambda does **not**
commit markdown to GitHub. An async **enricher** adds GPS/public geo, city/country,
and Bedrock vision tags.

## Flow

```
/upload (browser/phone)
  → POST /photos/auth          passcode → short-lived signed token
  → POST /photos/upload-url    token → presigned S3 PUT (title, caption, featured)
  → PUT (direct to S3)         original → uploads/incoming/…
                                     │ S3 ObjectCreated
                                     ▼
                               process.handler
                                 EXIF → resize 400/800/1200 WebP+JPEG
                                 → images bucket
                                 → ticket id → DynamoDB (enrichmentStatus=pending)
                                 → EventBridge PhotoPendingEnrichment
                                     │
                                     ▼
                               enrich.handler (photo-bus rule)
                                 original → GPS + fuzz public coords (~2 decimals / neighborhood)
                                 → AWS Location city/country
                                 → Bedrock tags from photo-1200.*
                                 → DynamoDB update (enrichmentStatus=complete)
```

**Public geo privacy:** Precise EXIF GPS is stored privately (`latitude` / `longitude`).
Public fields `publicLatitude` / `publicLongitude` are rounded to **2 decimal places**
(~1.1 km — neighborhood scale). The site map shows an area view without a pin.

Public / owner HTTP:

| Method | Path | Auth |
|--------|------|------|
| GET | `/photos` (use trailing slash on custom domain: `/photos/`) | none |
| GET | `/photos/featured` | none |
| GET | `/photos/{id}` | none |
| PATCH | `/photos/{id}` | HMAC token |

DTO includes `city`, `country`, `publicLatitude`/`publicLongitude`, `tags`, `enrichmentStatus` (never precise GPS).

## Functions (one zip)

| Handler | Trigger | Purpose |
|---------|---------|---------|
| `src/auth.handler` | `POST /photos/auth` | passcode → session token |
| `src/init.handler` | `POST /photos/upload-url` | presigned PUT + metadata |
| `src/photos-api.handler` | GET/PATCH photo routes | DynamoDB read/write API |
| `src/process.handler` | S3 `uploads/incoming/*` | optimize + DynamoDB + EventBridge |
| `src/enrich.handler` | EventBridge `PhotoPendingEnrichment` | GPS + Location + Bedrock |

## Secret

`photo-upload-secrets` (Secrets Manager), JSON:

```json
{
  "passcode": "the upload passcode you enter on /upload",
  "hmac": "a long random string used to sign session tokens",
  "ticketsPasscode": "passcode for the ticket server API"
}
```

## Infra extras

- DynamoDB `micahwalter-photos` + GSI1 + PITR
- EventBridge bus `photo-bus` + rule `photo-pending-enrichment` + **archive** (14 days)
- Place Index `micahwalter-photos-place-index` (Esri)
- SQS `photo-upload-process-dlq` (process OnFailure only — enricher uses archive replay)

## Prerequisites (ops)

1. Redeploy `micahwalter-www-github-actions` after CI IAM changes (Place Index / EventBridge rule+archive).
2. Enable Bedrock model access for `us.anthropic.claude-sonnet-4-6` in **us-east-1**.
3. EnrichFn IAM must allow Anthropic foundation models in **all regions** used by the
   `us.*` inference profile (often `us-east-2`), e.g.
   `arn:aws:bedrock:*::foundation-model/anthropic.*` — see issue #153. Us-east-1-only
   `foundation-model/*` is not enough and yields silent soft-fail (`bedrockOk: false`).

## Build

```bash
make build   # → dist/photo-upload.zip (bundles linux/arm64 sharp)
```

Deploys via `.github/workflows/photo-upload-deploy.yml` on push to `main` when
paths under `infra/photo-upload*` change.

## Backfill public coords (neighborhood fuzz)

After deploying an enricher that rounds to 2 decimals, re-fuzz existing photos
that already have GPS by force-invoking the enrich Lambda (rewrites public
coords from private GPS / original EXIF; also re-runs Location + Bedrock):

```bash
# Single photo
AWS_PROFILE=www aws lambda invoke \
  --function-name photo-upload-enrich \
  --cli-binary-format raw-in-base64-out \
  --payload '{"detail":{"photoId":"171","force":true}}' \
  /tmp/enrich-out.json

# Verify public coords are 2 decimals
curl -sS "https://api.micahwalter.com/photos/171" | jq '.publicLatitude, .publicLongitude'
```

List candidate ids from the public API (`GET /photos/?limit=50`) or DynamoDB
scan where `latitude` / `longitude` are set, then invoke for each id.
