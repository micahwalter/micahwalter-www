# Photo Upload Lambdas

Backend for the web-based photo upload feature (`/upload`) and the photo
metadata API. Uploads are processed into the images CDN and **photo metadata is
stored in DynamoDB** (`micahwalter-photos`). The process Lambda does **not**
commit markdown to GitHub.

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
                                 → EventBridge PhotoPendingEnrichment (best-effort)
                                 → (U2 enricher consumes later)
```

Public / owner HTTP:

| Method | Path | Auth |
|--------|------|------|
| GET | `/photos` | none (list; `limit`, `cursor`) |
| GET | `/photos/featured` | none |
| GET | `/photos/{id}` | none |
| PATCH | `/photos/{id}` | HMAC token (body `token` or `Authorization: Bearer`) |

## Functions (one zip)

| Handler | Trigger | Purpose |
|---------|---------|---------|
| `src/auth.handler` | `POST /photos/auth` | passcode → session token |
| `src/init.handler` | `POST /photos/upload-url` | presigned PUT + metadata |
| `src/photos-api.handler` | GET/PATCH photo routes | DynamoDB read/write API |
| `src/process.handler` | S3 `uploads/incoming/*` | optimize + DynamoDB + EventBridge |

## Secret

`photo-upload-secrets` (Secrets Manager), JSON:

```json
{
  "passcode": "the upload passcode you enter on /upload",
  "hmac": "a long random string used to sign session tokens",
  "ticketsPasscode": "passcode for the ticket server API"
}
```

`githubToken` is no longer used by process (safe to remove from the secret when convenient).

## Infra extras (U1)

- DynamoDB table `micahwalter-photos` + GSI1 (`PHOTO` / `{publishedAt}#{id}`), PITR on
- EventBridge bus `photo-bus` (enrichment handoff for U2)
- SQS `photo-upload-process-dlq` (process async OnFailure)

## Build

```bash
make build   # → dist/photo-upload.zip (bundles linux/arm64 sharp)
```

Deploys via `.github/workflows/photo-upload-deploy.yml` on push to `main` when
paths under `infra/photo-upload*` change. See repo `CLAUDE.md` (“Photo Upload”).
