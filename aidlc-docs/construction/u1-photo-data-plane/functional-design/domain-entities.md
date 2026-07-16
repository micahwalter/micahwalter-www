# U1 — Domain Entities

## Photo (aggregate root)

| Field | Type | Notes |
|-------|------|-------|
| `id` | string (numeric) | PK; from tickets |
| `title` | string | required after defaults |
| `caption` | string | single field for detail/listings; may be `""` |
| `publishedAt` | string (`YYYY-MM-DD`) | publish date |
| `createdAt` | string (ISO-8601) | immutable after create |
| `updatedAt` | string (ISO-8601) | bump on write |
| `featured` | boolean | homepage eligibility |
| `draft` | boolean | public queries exclude when true |
| `tags` | string[] | may be empty until U2 |
| `enrichmentStatus` | `pending` \| `complete` \| `failed` | U1 writes `pending` |
| `folderName` | string | CDN path segment |
| `coverImageKey` / `originalKey` | string | object keys or relative names as designed in infra |
| `exif` | object | camera, lens, aperture, shutterSpeed, iso, focalLength, dateTaken, width, height, format |
| `latitude` / `longitude` | number \| null | precise; null in U1 until U2 |
| `publicLatitude` / `publicLongitude` | number \| null | fuzzed; null until U2 |
| `category` | string | default e.g. `Photography` |

### Invariants
- `id` unique and immutable
- Public DTO never includes precise `latitude`/`longitude` (even when null/set later)
- Non-draft + exists ⇒ eligible for public get/list

## PublicPhotoDTO

Subset for anonymous clients:

- `id`, `title`, `caption`, `publishedAt`, `featured`, `tags`, `folderName`, cover URL fields, `exif` (non-GPS), `publicLatitude`, `publicLongitude`, `enrichmentStatus`

## ListPage

- `items: PublicPhotoDTO[]`
- `cursor: string | null` (null ⇒ no more pages)
- `limit: number`

## UploadProcessContext (transient)

- S3 bucket/key, content type  
- User metadata: title, caption, featured  
- Derived: buffer, exif, image keys, allocated id  

Not persisted as its own entity.

## AuthToken (existing)

- HMAC session from passcode exchange  
- Used only for authenticated HTTP writes in U1  

## Relationships

```text
UploadProcessContext --creates--> Photo
AuthToken --authorizes update--> Photo
Photo --projected as--> PublicPhotoDTO
ListPage --contains--> PublicPhotoDTO[]
```
