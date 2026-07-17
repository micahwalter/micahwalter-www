# U7 — Infrastructure Design

**Primary stack**: `micahwalter-photo-upload` (`infra/photo-upload.yml` + lambdas)  
**Secondary stack**: `micahwalter-photo-upload-secondary` (`infra/photo-upload-secondary.yml`, new)  
**Feed**: resources in primary photo-upload stack (or thin `infra/photo-feeds.yml` if cleaner — prefer **extend photo-upload**)  
**Regions**: us-east-1 (primary), us-east-2 (secondary)  
**Site**: existing `deploy.yml` + `infra/infra.yml` (CF already has photo/gallery shells)

---

## Logical → AWS mapping

| Logical component | Infrastructure |
|-------------------|----------------|
| PhotoMigrator | `scripts/migrate-photos.js` (Node; dry-run / `--apply`) → photo API upsert or direct DDB PutItem |
| ContentCleanup | `scripts/cleanup-photo-content.js` → filesystem/git; no AWS required |
| PhotosCLI | `cli/` + `scripts/import-photos.js` / tag script → HTTPS photo API + tickets + S3 |
| FeedPublisher | Lambda `photo-feed-publisher` + EventBridge rule (us-east-1) |
| FeedArtifactStore | S3 website bucket objects (e.g. `photos-feed.xml`, `sitemap-photos.xml`) served via CloudFront |
| PhotoUploadSecondary | CFN stack us-east-2: HTTP API + Lambdas + ApiMapping `photos` |
| AuthVerifier / PublicDtoProjector | Same JS in primary + secondary zip |
| ProcessCommitRemover | Delete/stop using `src/lib/github.js` from process path; drop `githubToken` from secret contract if unused |
| CutoverRunbook | `aidlc-docs/construction/u7-cutover/code/cutover-runbook.md` (Code Gen) |

---

## 1. PhotoMigrator

| Item | Spec |
|------|------|
| Script | `scripts/migrate-photos.js` |
| Source | `content/posts/*/index.md` with `type: photo` |
| Target | Upsert `micahwalter-photos` by `id` (prefer authenticated API create/upsert; direct DDB OK for ops with `www` profile) |
| GPS backfill | Read S3 original under images bucket when EXIF GPS present |
| Mode | Dry-run default; `--apply` |
| Idempotency | Put/Update by `id` |
| Auth | `PHOTO_UPLOAD_PASSCODE` / cached token, or AWS IAM for DDB |

---

## 2. ContentCleanup

| Item | Spec |
|------|------|
| Script | `scripts/cleanup-photo-content.js` |
| Removes | Photo folders under `content/posts/`; `content/galleries/*/index.md` (after U6 migrate verified) |
| Keeps | Blog + email markdown |
| Mode | Dry-run default; `--apply` |
| Delivery | Commit resulting tree in PR after verify |

---

## 3. PhotosCLI

| Command | Infra touchpoints |
|---------|-------------------|
| `blog photos:import` | Tickets API for id (if new); S3 upload/optimize as today; **POST/upsert photo metadata via photos API** — no git commit of photo `index.md` |
| `blog photos:tag` | Trigger enrichment / PATCH tags against DB ids |

Reuse existing AWS profile `www`, tickets credentials file, photo passcode.

---

## 4. FeedPublisher (primary us-east-1)

| Resource | Spec |
|----------|------|
| Lambda | `photo-feed-publisher` (Node 20, arm64, same zip or small dedicated handler in photo-upload package) |
| Schedule | EventBridge `rate(1 hour)` (adjustable) |
| Permissions | `dynamodb:Query` on photos table/GSI; `s3:PutObject` on website bucket for feed artifacts; optional `s3:GetObject` for merge |
| Artifacts | Write `photos-feed.xml` (RSS of photos, `/photos/<id>` links) and `sitemap-photos.xml` (or agreed names) to **website bucket** root/public paths CloudFront already serves |
| Blog feeds | Unchanged: `prebuild` still generates `feed.xml` / `sitemap.xml` from markdown; document that photo URLs live in the photo-specific artifacts **or** Code Gen merges photo URLs into sitemap on job run without touching blog RSS body |
| Failure | Log + non-zero; no deploy coupling |

Env: `PHOTOS_TABLE`, `WEBSITE_BUCKET` (or `FEED_BUCKET`), `SITE_URL`.

---

## 5. PhotoUploadSecondary (us-east-2)

Mirror `infra/tickets-secondary.yml` shape:

| Resource | Spec |
|----------|------|
| Template | `infra/photo-upload-secondary.yml` |
| Stack name | `micahwalter-photo-upload-secondary` |
| Artifacts bucket | `micahwalter-newsletter-artifacts-secondary` (existing) |
| API | HTTP API + stage + **ApiMappingKey `photos`** on secondary `api.micahwalter.com` |
| Functions | At minimum: `photos-api` (+ `auth` if browser unlock must work in failover); init/process/enrichment **optional** in secondary for U7 — **minimum bar = read/write photos+galleries API** for browse/edit/upload-auth parity |
| DynamoDB | Env points to **primary** table names/ARNs in us-east-1 (`micahwalter-photos`, `micahwalter-galleries`) |
| Secrets | Local replica of `photo-upload-secrets` (see §6) |
| IAM | Cross-region DDB on primary ARNs; secrets get; logs |
| Deploy | GitHub Actions workflow or extend photo-upload-deploy for us-east-2 (IAM already has secondary patterns for newsletter) |

**Out of U7 minimum**: Bedrock enricher + S3 process pipeline in us-east-2 (uploads/images already multi-region via CRR/CF). Document if upload-process stays primary-only.

---

## 6. Secrets

Update `photo-upload-secrets` in `photo-upload.yml`:

```yaml
ReplicaRegions:
  - Region: us-east-2
```

After deploy, confirm replica exists; secondary stack references secret **name** (regional replica).

Remove `githubToken` from documented required secret JSON once process no longer needs it (optional cleanup; do not break existing secret shape abruptly — Code Gen can stop reading it).

---

## 7. ProcessCommitRemover (primary)

| Change | Spec |
|--------|------|
| Code | Ensure `process.js` never calls `commitFiles`; remove unused `github.js` import path |
| Docs | CLAUDE/README: process writes DynamoDB only |
| Secret | `githubToken` unused for process |

---

## 8. CI / IAM

| Change | Mechanism |
|--------|-----------|
| Primary: FeedPublisher + schedule + S3 put + secret replica | `photo-upload.yml` + `photo-upload-deploy.yml` |
| Secondary stack | New workflow job or `photo-upload-secondary-deploy.yml`; extend `github-actions-role.yml` for us-east-2 photo-upload resources (table ARNs already primary; API/Lambda/CFN in us-east-2) |
| Site | `deploy.yml` for CLI/UI/script changes; cleanup commit removes photo folders |
| Website bucket put from FeedPublisher | Grant Lambda role `s3:PutObject` on website bucket; ensure bucket policy allows |

---

## 9. No / deferred resources

| Type | U7 |
|------|-----|
| DynamoDB global tables | Not required (tickets pattern) |
| New SNS alarms | No |
| Image re-key | No |
| Gallery CLI | No |
| New custom domain | No — reuse `api.micahwalter.com` |

---

## 10. Shared infrastructure touchpoints

| Shared | Use |
|--------|-----|
| `api-domain.yml` / `api-domain-secondary.yml` | ApiMapping `photos` |
| Newsletter artifacts buckets | Lambda zips primary + secondary |
| Website + images buckets / CF origin groups | Feed artifacts + image failover (existing) |
| Tickets API | CLI id allocation |
