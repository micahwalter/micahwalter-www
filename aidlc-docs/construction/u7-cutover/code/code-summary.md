# Code Generation Summary — U7 Cutover

**Unit**: U7 Cutover  
**Date**: 2026-07-17  
**Status**: Complete (pending deploy + operator migrate/cleanup)

## What was generated

### A. Process / secrets
| Change | Detail |
|--------|--------|
| Removed `src/lib/github.js` | Dead GitHub commit client |
| `secrets.js` | Document githubToken obsolete |
| `photo-upload.yml` | `ReplicaRegions: us-east-2` on `photo-upload-secrets` |

### B–C. Migrator / cleanup
| Script | Purpose |
|--------|---------|
| `scripts/migrate-photos.js` | Markdown photos → DynamoDB upsert by `id`; `--apply`; optional `--gps` |
| `scripts/cleanup-photo-content.js` | Remove photo folders (+ `--galleries`); dry-run / `--apply` |

### D. CLI
| Script | Change |
|--------|--------|
| `scripts/import-photos.js` | Writes DynamoDB + stages image (no `index.md`) |
| `scripts/tag-photos.js` | Tags by photo `id` / `--all` against DynamoDB + S3 |
| `cli/index.js` | Help text updated |

### E. FeedPublisher
| Resource | Detail |
|----------|--------|
| `src/feed-publisher.js` | Hourly job writes `photos-feed.xml` + `sitemap-photos.xml` |
| CFN | Lambda, IAM, EventBridge `rate(1 hour)`, `WebsiteBucketName` param |
| Deploy workflow | Updates `feed-publisher` function code |

### F. Secondary stack
| File | Detail |
|------|--------|
| `infra/photo-upload-secondary.yml` | us-east-2 auth + photos-api; primary DDB; ApiMapping `photos` |
| `.github/workflows/photo-upload-secondary-deploy.yml` | Secondary deploy |
| `github-actions-role.yml` | us-east-2 photo-upload + secret replicate + feed rule |

### Supporting
| Change | Detail |
|--------|--------|
| `photos-db.js` / `galleries-db.js` | `DYNAMODB_REGION` for cross-region secondary |
| `upsertPhoto` | Idempotent Put for migration/CLI |

## Explicit non-goals shipped as docs only
- No Bedrock/process in us-east-2
- No auto-migrate in CI
- Blog `feed.xml` / main sitemap remain prebuild

## Ops
See `cutover-runbook.md`.
