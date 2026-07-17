# U3 — Domain Entities (light)

**Unit**: Upload UI  
**Story**: US-001  
**Decisions**: FD plan Q1–Q8 = A

---

## UploadSession (client state)

| Field | Type | Notes |
|-------|------|-------|
| `token` | string | HMAC session from `/photos/auth` |
| `phase` | `locked` \| `ready` \| `busy` | Page-level gate |
| `items` | UploadItem[] | Selected files + per-file metadata/status |

## UploadItem

| Field | Type | Notes |
|-------|------|-------|
| `localId` | string | Client-only id |
| `file` | File | JPEG/PNG |
| `title` | string | Pre-filled from filename; editable |
| `caption` | string | Optional; sent to init |
| `featured` | boolean | Per-file |
| `status` | `pending` \| `uploading` \| `done` \| `error` | Per-file |
| `progress` | number \| null | 0–100 if known; else indeterminate while uploading |
| `errorMessage` | string \| null | |

## Constraints

- Max **20** files per selection  
- Upload concurrency **3**  
- Types: **JPEG/PNG** only  
- Auth: existing passcode → token (unchanged)  

## Backend contracts (existing U1)

- `POST /photos/auth` `{ passcode }` → `{ token }`  
- `POST /photos/upload-url` `{ token, filename, contentType, title, caption, featured }` → `{ url, headers }`  
- Browser `PUT` to S3 with signed headers  

No new DynamoDB entities in U3.
