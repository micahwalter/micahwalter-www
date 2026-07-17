# U6 — Frontend Components (Galleries)

---

## `lib/photos-api.ts` (extend)

| Export | Behavior |
|--------|----------|
| `listGalleries()` | Public GET list (non-draft) |
| `getGallery(slug)` | Public GET one |
| `adminListGalleries(token)` | Admin list including drafts (if distinct) |
| `createGallery(input, token)` | POST |
| `updateGallery(slug, patch, token)` | PATCH metadata |
| `setGalleryMembership(slug, photoIds, token)` | PATCH/PUT membership |

Exact path prefix: `/galleries` under photo API base (Infra locks).

---

## Hub — Galleries tab (`UploadHub`)

| Piece | Responsibility |
|-------|----------------|
| Third tab **Galleries** | After Upload \| Edit |
| `GalleryAdminPanel` | List galleries; create form; select → metadata + ordered id membership editor |
| Auth | Reuse sessionStorage token |

---

## Public UI

| Route | Behavior |
|-------|----------|
| `app/galleries/page.tsx` | Client island lists galleries from API |
| `app/galleries/[slug]/page.tsx` | Client detail: title, description, mosaic/grid of API photos → `/photos/<id>`; placeholder `generateStaticParams` + CF shell rewrite pattern if needed (like U4) |

Preserve existing gallery visual language where practical.

---

## Migration

- Script under `scripts/` or `infra/` invoked in U6 CG / ops docs — not a public UI.
