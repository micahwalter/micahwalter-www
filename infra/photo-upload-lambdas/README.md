# Photo Upload Lambdas

Backend for the web-based photo upload feature (`/upload`). Reproduces the
`blog photos:import` + `blog images:sync` CLI pipeline as a serverless flow and
commits the resulting post to the repo, which triggers the normal site deploy.

## Flow

```
/upload (browser/phone)
  → POST /photos/auth        passcode → short-lived signed token   (auth.handler)
  → POST /photos/upload-url  token → presigned S3 PUT URL          (init.handler)
  → PUT (direct to S3)       original photo → uploads/incoming/…
                                   │ S3 ObjectCreated
                                   ▼
                             process.handler
                               EXIF → resize 400/800/1200 WebP+JPEG
                               → images bucket (processed + original)
                               → commit index.mdx + post-counter via GitHub API
                               → site rebuilds (~3–4 min)
```

Direct-to-S3 upload avoids API Gateway / Lambda request-size limits for
multi-megabyte phone photos. Title and the "feature on homepage" flag ride
along as S3 object metadata, so `process` needs no separate datastore.

## Functions (one zip, three handlers)

| Handler            | Route / trigger              | Purpose                              |
|--------------------|------------------------------|--------------------------------------|
| `src/auth.handler` | `POST /photos/auth`          | passcode → signed session token      |
| `src/init.handler` | `POST /photos/upload-url`    | issue presigned S3 PUT URL           |
| `src/process.handler` | S3 `uploads/incoming/*`   | process + commit the post            |

## Secret

`photo-upload-secrets` (Secrets Manager), JSON:

```json
{
  "passcode": "the upload passcode you enter on /upload",
  "hmac": "a long random string used to sign session tokens",
  "githubToken": "fine-grained PAT, Contents: read & write on micahwalter/micahwalter-www"
}
```

## Build

```bash
make build   # → dist/photo-upload.zip (bundles linux/arm64 sharp)
```

Deploys automatically via `.github/workflows/photo-upload-deploy.yml` on push
to `main`. See the repo `CLAUDE.md` (“Photo Upload”) for the full deploy and
one-time setup steps.
