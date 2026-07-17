# Build Instructions — Issues #103 / #104 (Photo Cutover U1–U7)

## Prerequisites

| Item | Value |
|------|-------|
| Node | 20+ |
| Package manager | npm |
| AWS CLI | v2 (for Lambda zip deploy / migrate apply) |
| Go | Not required for photo-upload Node Lambdas |
| Env | `NEXT_PUBLIC_PHOTO_API_URL=https://api.micahwalter.com/photos` for site builds that exercise photo islands |

## Dependencies

```bash
npm install
cd infra/photo-upload-lambdas && npm install && cd ../..
```

## Build site (static export)

```bash
export NEXT_PUBLIC_PHOTO_API_URL=https://api.micahwalter.com/photos
npm run build
```

**Success:** Next.js compiles, static pages export under `/out`, exit 0.  
**Artifacts:** `/out/**`, plus prebuild `public/posts.json`, `public/feed.xml`, `public/sitemap.xml`.  
**Note:** `public/mastodon.json` may refresh during prebuild — do not commit.

## Build photo-upload Lambda zip

```bash
cd infra/photo-upload-lambdas
make build
# → dist/photo-upload.zip
```

Shared zip for: auth, init, process, photos-api, enrich, feed-publisher (and secondary auth/photos-api).

## Configure environment (local)

```bash
# .env.local (site)
NEXT_PUBLIC_PHOTO_API_URL=https://api.micahwalter.com/photos

# Migrators / CLI (operator machine)
export AWS_PROFILE=www
export AWS_REGION=us-east-1
export PHOTOS_TABLE=micahwalter-photos
export GALLERIES_TABLE=micahwalter-galleries
# Optional: PHOTO_UPLOAD_PASSCODE / tickets credentials for CLI
```

## Verify build success

- [ ] `npm run build` exit 0
- [ ] `infra/photo-upload-lambdas/dist/photo-upload.zip` exists after `make build`
- [ ] No TypeScript errors in photo/gallery client components

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Build fails on empty `generateStaticParams` | Ensure placeholder routes (`/photos/0`, `/galleries/_placeholder`) exist |
| Module not found `@aws-sdk/client-dynamodb` | `npm install` at repo root (cutover scripts) |
| Sharp native binary issues in Lambda zip | Use `make build` (forces linux/arm64 sharp) |
| Mastodon fetch warning | Non-blocking; existing `mastodon.json` kept |

## Deploy builds (CI)

| Workflow | What |
|----------|------|
| `deploy.yml` | Site → S3 + CloudFront |
| `photo-upload-deploy.yml` | Primary us-east-1 stack / function code |
| `photo-upload-secondary-deploy.yml` | Secondary us-east-2 |
| Infra stacks | `infra.yml`, `github-actions-role.yml` as needed |

See also: `aidlc-docs/construction/u7-cutover/code/cutover-runbook.md`
