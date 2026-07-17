# U7 — Deployment Architecture

## Runtime topology

```text
=== Cutover ops (one-time) ===
Operator
  -> scripts/migrate-photos.js (dry-run | --apply)
       -> Photo API / DynamoDB micahwalter-photos (us-east-1)
       -> optional S3 originals EXIF GPS backfill
  -> verify GET /photos/{id}, /photos, homepage
  -> scripts/cleanup-photo-content.js (dry-run | --apply)
       -> remove photo folders + gallery markdown
       -> git commit / PR

=== Steady state: CLI ===
blog photos:import / photos:tag
  -> tickets API (id) + S3 images + photos API (HMAC)
  -> DynamoDB (no photo index.md commit)

=== Steady state: feeds ===
EventBridge (1h)
  -> photo-feed-publisher Lambda (us-east-1)
  -> Query micahwalter-photos GSI
  -> PutObject website bucket: photos-feed.xml, sitemap-photos.xml
  -> CloudFront www serves artifacts

=== Steady state: multi-region API ===
Client -> api.micahwalter.com (Route53 failover)
  PRIMARY  us-east-1 photo-upload stack -> local DDB
  SECONDARY us-east-2 photo-upload-secondary
       -> cross-region DDB us-east-1
       -> secrets replica us-east-2

Images: CloudFront origin group -> primary/secondary S3 (existing CRR)
```

### Text alternative

1. Migrate markdown photos into DynamoDB; verify public API.  
2. Deploy feed publisher; confirm photo feed/sitemap artifacts refresh on schedule.  
3. Deploy secondary photo API stack; confirm ApiMapping + failover readiness.  
4. Point CLI at API for import/tag.  
5. Remove photo/gallery markdown from the content tree after verify.  
6. Visitors continue to use client/API photo and gallery pages; blog stays static markdown.

---

## Deploy pipeline (recommended order)

| Step | Action |
|------|--------|
| 1 | Primary: secret ReplicaRegions + FeedPublisher Lambda/rule + IAM (`photo-upload.yml`) |
| 2 | Build/upload lambda zip; deploy `micahwalter-photo-upload` |
| 3 | Secondary: add `photo-upload-secondary.yml` + GHA/IAM; deploy us-east-2 |
| 4 | Confirm `api.micahwalter.com` secondary mapping for `photos` |
| 5 | Site/CLI/scripts via `deploy.yml` (or this branch merge) |
| 6 | `migrate-photos.js` dry-run → `--apply` |
| 7 | Verify browse/detail/search/galleries |
| 8 | Confirm feed artifacts appear in website bucket / CDN |
| 9 | `cleanup-photo-content.js` dry-run → `--apply` + commit |
| 10 | Smoke blog/email build + spot-check redirects |

**Order rationale**: API/feed/secondary before destructive content cleanup; migrate before cleanup.

---

## Environments

| Env | Notes |
|-----|-------|
| Production primary | us-east-1 stacks + www |
| Production secondary | us-east-2 photo-upload-secondary; DDB primary |
| Local | `NEXT_PUBLIC_PHOTO_API_URL`; migrator/CLI need passcode + AWS as applicable |

## Rollback

1. Redeploy prior Lambda/templates; EventBridge rule can be disabled.  
2. Secondary stack can be deleted/disabled without deleting primary data.  
3. Feed artifacts: overwrite with previous S3 versions if versioning on; else regenerate from prebuild.  
4. Content cleanup: revert git commit that deleted folders (markdown restore).  
5. Migrated DDB rows retained (PITR); safe to leave in place.

## Verification checklist

- [ ] Migrator dry-run lists ~44 photos; `--apply` upserts; `GET /photos/{id}` works  
- [ ] Homepage / `/photos` / search show migrated set  
- [ ] `/posts/<digits>` → 301 `/photos/<id>`  
- [ ] `blog photos:import` / `photos:tag` hit API (no new photo markdown SoT)  
- [ ] Feed Lambda runs; `photos-feed.xml` (and sitemap photo artifact) on CDN with `/photos/<id>`  
- [ ] Blog `feed.xml` still from prebuild  
- [ ] Secondary stack healthy; ApiMapping `photos` present in us-east-2  
- [ ] Secret replica in us-east-2  
- [ ] Process path has no GitHub commit  
- [ ] Cleanup removes photo folders; `npm run build` green; blog/email OK  
- [ ] Galleries still API-backed after gallery markdown removal  
