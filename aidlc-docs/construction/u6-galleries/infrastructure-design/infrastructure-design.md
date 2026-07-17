# U6 — Infrastructure Design

**Stack**: `micahwalter-photo-upload` (`infra/photo-upload.yml` + `infra/photo-upload-lambdas/`)  
**Region**: us-east-1  
**Site**: Next.js static export via existing `deploy.yml`

---

## Logical → AWS mapping

| Logical component | Infrastructure |
|-------------------|----------------|
| GalleryStore | DynamoDB table `micahwalter-galleries` |
| GalleryAdminHandler / GalleryQueryHandler | Extend Lambda `photo-upload-photos-api` (`src/photos-api.handler` + `src/lib/galleries-db.js`) |
| PublicGalleryDtoProjector | In-process JS helper |
| PhotoResolver | Client (`lib/photos-api.ts`) parallel GET `/{id}` |
| GalleryAdminPanel / Public islands | Next.js under `app/upload`, `app/galleries` |
| GalleryMigrator | Node script (e.g. `scripts/migrate-galleries.js`) run with AWS creds |
| AuthVerifier | Existing secrets + token lib |

---

## DynamoDB: GalleriesTable

| Property | Value |
|----------|-------|
| TableName | `micahwalter-galleries` (parameterizable) |
| BillingMode | PAY_PER_REQUEST |
| KeySchema | `slug` (S) HASH |
| PITR | Enabled (match photos table) |
| GSI | None required for U6 (list via Scan acceptable for tiny N) |

Item attributes: `slug`, `title`, `description`, `coverPhotoId`, `publishedAt`, `photoIds` (list), `draft`, `content`, `createdAt`, `updatedAt`.

---

## API Gateway routes

Custom domain mapping key remains `photos` → base `https://api.micahwalter.com/photos`.

**Add routes (specific paths must win over `GET /{id}`):**

| RouteKey | Auth | Purpose |
|----------|------|---------|
| `GET /galleries` | Public | List non-draft (admin may use query `?all=1` + token for drafts) |
| `GET /galleries/{slug}` | Public | Get one (404 if draft/missing for public) |
| `POST /galleries` | HMAC | Create |
| `PATCH /galleries/{slug}` | HMAC | Metadata + membership (`photoIds`) |

**Critical**: Register `/galleries` and `/galleries/{slug}` so `GET /{id}` never treats `galleries` as a photo id.

Env on PhotosApiFn: add `GALLERIES_TABLE`.

---

## IAM (PhotosApiFnRole)

Add:
- `dynamodb:GetItem`, `PutItem`, `UpdateItem`, `Scan` (and `Query` if added later) on `micahwalter-galleries` ARN

Keep existing photos table + secrets permissions.

---

## CloudFront (www)

If `/galleries/<slug>` needs static-export shell (like photos):

- Extend `StaticHTMLRoutingFunction` to rewrite `/galleries/<slug>` (non-reserved) → `/galleries/_shell.html` or placeholder id page — **only if** Code Gen uses placeholder params.
- Existing `/galleries` index already static.

Document chosen shell strategy in Code Gen.

---

## Migration

| Item | Spec |
|------|------|
| Script | `scripts/migrate-galleries.js` (or under `infra/`) |
| Auth | AWS profile `www` / env creds; direct DynamoDB put (or admin API with token) |
| Mode | Dry-run default; `--apply` to write |
| Source | `content/galleries/*/index.md` |
| Idempotency | Upsert by `slug` |

---

## CI / deploy

| Change | Mechanism |
|--------|-----------|
| Table + routes + IAM + env | `photo-upload.yml` → `photo-upload-deploy.yml` |
| Lambda code | Same zip `photo-upload.zip` |
| Site UI | `deploy.yml` |
| CI IAM | Confirm role can create DDB table + API routes (existing photo-upload deploy role; extend if needed) |

## No new resources

| Type | U6 |
|------|-----|
| New Lambda function | No |
| SQS / EventBridge | No |
| Secrets | No |
| Alarms | No |
