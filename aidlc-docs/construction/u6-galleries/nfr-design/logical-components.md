# U6 — Logical Components

Minimal set. Infrastructure binding → Infrastructure Design.

---

## GalleryStore

- **Role**: DynamoDB persistence for GalleryRecord (PK=`slug`)  
- **Ops**: put, get by slug, list (scan/query), update metadata, setMembership  
- **NFR**: on-demand table; least-privilege IAM  

## GalleryAdminHandler

- **Role**: Authenticated create/rename/membership/draft updates  
- **Flow**: verify HMAC → validate slug/title/photoIds → GalleryStore  
- **Host**: photos-api Lambda routes under `/galleries`  

## GalleryQueryHandler

- **Role**: Public list + get by slug (exclude draft)  
- **Optional**: attach resolved photo summaries server-side **or** leave resolve to client (Code Gen picks; prefer client resolve to keep handler thin unless chatty)  

## PublicGalleryDtoProjector

- **Role**: Map GalleryRecord → PublicGalleryDTO (no internal fields)  

## PhotoResolver (client or thin server helper)

- **Role**: Given `photoIds[]`, fetch PublicPhotos with concurrency 3–5; skip missing  
- **NFR**: best-effort; no batch API  

## GalleryAdminPanel (hub)

- **Role**: `/upload` Galleries tab — list/create/edit membership ordered ids  
- **Auth**: shared sessionStorage token  

## GalleryPublicIslands

- **Role**: `/galleries` index + `/galleries/[slug]` client pages  
- **NFR**: Retry UX; static-export placeholder/shell as needed  

## GalleryMigrator

- **Role**: Read `content/galleries/*/index.md` → upsert GalleryStore by slug  
- **NFR**: dry-run; idempotent; do not delete markdown  

## AuthVerifier (reuse U1)

- **Role**: HMAC token check on admin gallery routes  

---

## Explicitly not in U6 logical set

| Component | Reason |
|-----------|--------|
| GalleryDeleteService | No delete |
| GalleryCache | No API cache |
| Dedicated GalleriesLambda | Same photos-api zip |
| MarkdownGalleryFallback | API-only after wiring |

---

## Component → NFR map

| Component | Key NFRs |
|-----------|----------|
| GalleryStore | S2, SEC4 |
| GalleryAdminHandler | SEC2–3, O1 |
| GalleryQueryHandler | SEC1, C1, P1 |
| PhotoResolver | P2, R2 |
| GalleryPublicIslands | R1, SEO1 |
| GalleryMigrator | R3, M2 |
