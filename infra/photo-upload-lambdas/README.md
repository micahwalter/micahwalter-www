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
                                 original → GPS + fuzz public coords
                                 → AWS Location city/country
                                 → Bedrock tags from photo-1200.*
                                 → DynamoDB update (enrichmentStatus=complete)
```

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

## Build

```bash
make build   # → dist/photo-upload.zip (bundles linux/arm64 sharp)
```

Deploys via `.github/workflows/photo-upload-deploy.yml` on push to `main` when
paths under `infra/photo-upload*` change.
