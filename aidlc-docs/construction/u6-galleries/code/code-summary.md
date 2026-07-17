# Code Generation Summary — U6 Galleries

**Unit**: U6 Galleries  
**Date**: 2026-07-16  
**Status**: Complete (pending deploy + migration apply)

## What was generated

### Backend / infra
| File | Change |
|------|--------|
| `infra/photo-upload-lambdas/src/lib/galleries-db.js` | DynamoDB CRUD for galleries (`slug` PK) |
| `infra/photo-upload-lambdas/src/photos-api.js` | Gallery routes: `GET/POST /galleries`, `GET/PATCH /galleries/{slug}` (before photo `GET /{id}`) |
| `infra/photo-upload.yml` | `GalleriesTable`, IAM, `GALLERIES_TABLE` env, API Gateway routes |
| `infra/github-actions-role.yml` | Deploy perms for `micahwalter-galleries` |
| `infra/infra.yml` | CloudFront Function rewrite `/galleries/<slug>` → `/galleries/_placeholder.html` |

### Frontend client
| File | Change |
|------|--------|
| `lib/photos-api.ts` | `listGalleries`, `getGallery`, `createGallery`, `updateGallery`, `resolveGalleryPhotos`, admin token helpers |

### Admin UI
| File | Change |
|------|--------|
| `app/upload/GalleryAdminPanel.tsx` | Create / edit galleries (slug, title, description, draft, photo IDs) |
| `app/upload/UploadHub.tsx` | **Galleries** tab |

### Public UI
| File | Change |
|------|--------|
| `components/ApiGalleriesIndex.tsx` | Client index — published galleries only |
| `components/ApiGalleryCard.tsx` | Card with cover from first photo |
| `components/ApiGalleryDetail.tsx` | Detail + `GalleryViewer` + draft handling |
| `app/galleries/page.tsx` | Shell → `ApiGalleriesIndex` |
| `app/galleries/[slug]/page.tsx` | Placeholder `_placeholder` + client detail |
| `components/GalleryViewer.tsx` | Links → `/photos/<id>` |

### Migration
| File | Change |
|------|--------|
| `scripts/migrate-galleries.js` | Markdown → API; dry-run default; `--apply` |

## API surface

| Method | Path | Auth |
|--------|------|------|
| GET | `/galleries` | Public (`?includeDrafts=1` + Bearer for drafts) |
| POST | `/galleries` | Bearer |
| GET | `/galleries/{slug}` | Public (drafts need Bearer) |
| PATCH | `/galleries/{slug}` | Bearer |

## Deploy notes (ops)

1. Redeploy `micahwalter-www-github-actions` if galleries DDB perms not yet live.
2. Deploy `micahwalter-photo-upload` (table + routes + Lambda code).
3. Deploy `micahwalter-www` / `infra/infra.yml` for CF Function gallery rewrite.
4. Run `node scripts/migrate-galleries.js` then `--apply` with `PHOTO_UPLOAD_PASSCODE`.
5. Site build needs `NEXT_PUBLIC_PHOTO_API_URL`.

## Deferred to U7

- Remove markdown `content/galleries/` as source of truth
- Full cutover cleanup
