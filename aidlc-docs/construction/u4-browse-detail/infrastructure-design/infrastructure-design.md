# U4 — Infrastructure Design

**Stacks**:  
- Site: existing Next.js static export → S3 + CloudFront (`deploy.yml`)  
- Redirects: `micahwalter-www` / `infra/infra.yml` — extend `StaticHTMLRoutingFunction`  
- Photo data: existing `micahwalter-photo-upload` API (no U4 API changes required)

**Region**: us-east-1 (www + API primary)

---

## Logical → infrastructure mapping

| Logical component | Infrastructure / impl |
|-------------------|------------------------|
| PhotosApiClient | Browser → HTTPS `api.micahwalter.com/photos` (existing API Gateway + `photos-api` Lambda + DynamoDB) |
| HomePhotosIsland / PhotosGridIsland / PhotoDetailIsland / SearchPhotoAugmentor | Static HTML/JS on S3 via CloudFront www; client `fetch` |
| PhotoStaticMap | External HTTPS static map image host (OSM-style); no AWS map resources |
| StaticExportDetailShell | Next.js `app/photos/[id]` in static export output |
| RedirectLayer | CloudFront Function `StaticHTMLRoutingFunction` in `infra/infra.yml` |

---

## CloudFront Function change (`StaticHTMLRoutingFunction`)

Insert **before** `getLegacyPostRedirect` and before `.html` rewrite:

| Match | Action |
|-------|--------|
| URI `/posts/<digits>` (one or more digits only; optional trailing slash normalized per existing rules) | **301** `Location: /photos/<digits>` |
| URI `/posts/<slug>` (non-numeric) | No change — continue existing legacy/HTML routing |

**Ordering rationale** (issue-90): only one viewer-request Function per behavior; photo-id redirect must run before slug→`/posts/` legacy rules and before `uri + '.html'`.

**Reserved routes**: existing `isReservedSegment` already includes `photos` and `posts`.

---

## No new AWS resources in U4

| Resource type | U4 action |
|---------------|-----------|
| Lambda | None |
| DynamoDB | None |
| API Gateway routes | None (consume U1 GETs) |
| S3 buckets | None |
| EventBridge / SQS | None |
| Secrets | None (no Mapbox token) |
| Alarms | None |

---

## Frontend / env

| Variable | Use |
|----------|-----|
| `NEXT_PUBLIC_PHOTO_API_URL` | Already required for upload; browse uses same base |
| `NEXT_PUBLIC_CDN_URL` | Image URLs if not fully absolute from API |

CI (`deploy.yml`) must continue to bake these secrets into the static build (same as today for Fathom/giscus/photo API).

---

## Static map

| Item | Spec |
|------|------|
| Builder | `buildStaticMapUrl(lat, lon)` in `lib/photos-api.ts` (or sibling helper) |
| Host | OSM-compatible static map URL pattern (no AWS Location Maps product in U4) |
| Failure | Client hides `<img>` on error |
| Privacy | Only public (fuzzed) coordinates in query string |

---

## Local / non-CloudFront

- Dev (`npm run dev`): no CF Function — optional Next.js redirect for `/posts/<numeric-id>` → `/photos/<id>` for parity (Code Gen).  
- Production: CF Function is source of truth for 301s.

---

## IAM / CI

| Change | Needed? |
|--------|---------|
| `github-actions-role.yml` | Only if infra-deploy role lacks permission to update CloudFront Functions (already used for issue-90 — expect **no** IAM change) |
| `infra-deploy.yml` | Trigger on `infra/infra.yml` change (existing) |
| `photo-upload-deploy.yml` | No U4 change |
