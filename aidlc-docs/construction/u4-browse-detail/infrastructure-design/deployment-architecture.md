# U4 — Deployment Architecture

## Runtime topology

```text
Visitor
  |
  +--> CloudFront www (micahwalter-www)
  |      |
  |      +-- StaticHTMLRoutingFunction (viewer-request)
  |      |     /posts/123  --> 301 /photos/123
  |      |     /posts/my-slug --> pass through (blog)
  |      |     other URIs --> existing HTML routing
  |      v
  |     S3 static export (Next.js out/)
  |      - /photos/index.html
  |      - /photos/[id] shell --> client fetch
  |      - homepage islands --> client fetch
  |
  +--> api.micahwalter.com/photos  (existing)
         GET /  GET /featured  GET /{id}
         --> photos-api Lambda --> DynamoDB micahwalter-photos

  Detail map <img> --> external OSM staticmap host (best-effort)
  Images --> CloudFront /images/* (existing images distribution)
```

### Text path (browse)

1. Browser loads static shell from www CloudFront/S3.  
2. Client island calls photo API for featured/list/detail.  
3. Cards/detail link to `/photos/<id>`.  
4. Legacy bookmark `/posts/<id>` hits CF Function → 301 → detail shell → client GET by id.

### Search path

1. SearchBar opens → fetch `posts.json` (existing) + bounded photo list prefetch.  
2. Filter/merge; photo hits navigate to `/photos/<id>`.

---

## Deploy pipeline

| Artifact | Mechanism |
|----------|-----------|
| Site UI (islands, routes, `photos-api` client) | Push → `deploy.yml` → `npm run build` → S3 sync → CF invalidation |
| Redirect Function | Change `infra/infra.yml` → `infra-deploy.yml` (or manual CFN deploy) → Function publish |
| Photo API | No U4 deploy required |

**Recommended order for production redirects**: deploy CF Function **before or with** site UI that removes any remaining reliance on `/posts/<id>` for photos. Site can ship first; redirects activate when Function updates.

---

## Environments

| Env | Behavior |
|-----|----------|
| Production | CF Function 301 + static export + live API |
| Local dev | Next optional numeric redirect; API via `NEXT_PUBLIC_PHOTO_API_URL`; no CF |
| Preview | Same as prod build if env vars set in CI |

---

## Rollback

1. **Site**: redeploy previous static build.  
2. **Redirects**: revert Function code in `infra/infra.yml` and redeploy stack (numeric `/posts/<id>` stops redirecting).  
3. Photo API/data unchanged by U4 rollback.

---

## Verification checklist (post-deploy)

- [ ] `GET https://www.micahwalter.com/posts/<known-photo-id>` → 301 → `/photos/<id>`  
- [ ] Blog `/posts/<slug>` still 200  
- [ ] Homepage featured/recent load from API  
- [ ] `/photos` Load more works  
- [ ] `/photos/<id>` renders; map when public geo present  
- [ ] Search returns a photo hit linking to `/photos/<id>`  
