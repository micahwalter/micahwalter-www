# U5 — Domain Entities (Edit UI)

No new persistence entities. U5 edits the existing Photo via U1 PATCH.

---

## EditablePhoto (form model)

| Field | Type | Notes |
|-------|------|--------|
| `id` | string | Route / selection key |
| `title` | string | Required non-empty on save |
| `caption` | string | May be empty |
| `tags` | string[] | From comma-separated input; trim; drop empties |
| `featured` | boolean | Featured flag |
| `folderName` / cover | read-only | Preview image only |

Not edited in U5: precise GPS, public lat/lon, city/country, exif, draft, enrichmentStatus.

---

## AdminSession

| Field | Type | Notes |
|-------|------|--------|
| `token` | string | HMAC session from `/auth` |
| `storage` | sessionStorage | Shared across `/upload` upload + edit surfaces |

---

## PhotoListItem (hub picker)

Subset of PublicPhoto: `id`, `title`, `publishedAt`, `featured`, cover for thumb.
