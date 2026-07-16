# U1 — Business Logic Model

**Unit**: Photo data plane  
**Story**: US-002  

---

## Purpose

Persist photo metadata in DynamoDB when an upload is processed, expose public read and authenticated update APIs, and stop writing photo markdown to git.

## Primary workflow — Process persist

```text
S3 ObjectCreated (uploads bucket)
  -> load object + user metadata (title, caption, featured)
  -> optimize images to images bucket
  -> allocate ticket id
  -> build Photo record (defaults applied)
  -> PutItem DynamoDB
  -> enqueue enrichment (U2; out of scope for U1 logic details)
  -> DONE (no GitHub commit)
```

### Failure short-circuit
If optimize **or** ticket allocation fails → **no DynamoDB write**; log error; S3 original may remain until lifecycle expiry.

## Secondary workflow — Public read

```text
Client -> GET list | get by id | featured | (search stub/contract if included)
  -> load from repository
  -> filter draft=false for public
  -> map to PublicPhotoDTO (no precise GPS in U1; fields may be null until U2)
  -> return
```

## Tertiary workflow — Authenticated metadata update

```text
Client -> PATCH /photos/{id} + HMAC token
  -> verify token
  -> load photo
  -> apply allowed patch fields
  -> updatedAt = now
  -> save
  -> return record/DTO
```

## Transformations

| Step | Input | Output |
|------|-------|--------|
| Title default | empty / missing title, filename | sanitized filename-based title |
| Caption default | empty caption, EXIF camera | `Photo taken with {camera}` or `""` |
| publishedAt | process time | ISO date `YYYY-MM-DD` (upload day) |
| enrichmentStatus | new record | `pending` |
| draft | new upload | `false` unless explicitly set (U1 supports field) |
| featured | S3 metadata / init | boolean |

## Integration points (logical)

| System | Interaction |
|--------|-------------|
| Tickets API | Allocate numeric id |
| S3 uploads | Source object + metadata |
| S3 images | Store optimized variants + original key refs |
| DynamoDB | Photo persistence |
| Enrichment queue | Message after successful put (U2 consumer) |
| Auth (HMAC) | Browser PATCH only |
| IAM | Process Lambda DynamoDB/S3/tickets access |
