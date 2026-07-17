# U4 — Domain Entities (Browse & detail)

U4 consumes the public photo model from U1/U2. No new persistence entities.

---

## PublicPhoto (read model)

Fields used by browse/detail/search (from PublicPhotoDTO):

| Field | Type | U4 use |
|-------|------|--------|
| `id` | number (string in URL) | Route `/photos/<id>`; card/detail links |
| `title` | string | Cards, detail H1, search |
| `caption` | string \| null | Detail body; search; card excerpt if needed |
| `publishedAt` | ISO date string | Sort, display date |
| `featured` | boolean | Homepage hero eligibility (server picks via `/featured`) |
| `tags` | string[] | Detail chips; search match |
| `exif` | object \| null | Detail EXIF panel when present |
| `publicLatitude` / `publicLongitude` | number \| null | Static map when both set |
| `city` / `country` | string \| null | Display via tags / secondary text if useful |
| `image` / CDN keys | URLs or key parts | Hero, grid, detail image |
| `enrichmentStatus` | string \| null | Optional; do not block render |

**Never expose** precise `latitude` / `longitude` on public pages.

---

## PhotoListPage

| Field | Type | Notes |
|-------|------|--------|
| `items` | PublicPhoto[] | One page of results |
| `nextCursor` | string \| null | For Load more |
| `limit` | number | Default **12** (match current grid) |

---

## SearchHit

| Field | Type | Notes |
|-------|------|--------|
| `kind` | `'photo' \| 'post'` | Merge with existing blog search |
| `id` / `slug` | string | Photo → numeric id |
| `title` | string | |
| `href` | string | Photos → `/photos/<id>` |
| `snippet` | string \| null | Optional caption/tag match hint |

---

## RedirectRule (RedirectLayer)

| Field | Type | Notes |
|-------|------|--------|
| `from` | path | `/posts/<numeric-id>` |
| `to` | path | `/photos/<id>` |
| `status` | 301 | Permanent |
| `match` | rule | Path is `/posts/` + digits only; non-numeric blog slugs untouched |
