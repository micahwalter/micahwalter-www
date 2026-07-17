# U6 — Domain Entities (Galleries)

---

## GalleryRecord (DynamoDB)

| Field | Type | Notes |
|-------|------|--------|
| `slug` | string | **Partition key**; URL `/galleries/<slug>` |
| `title` | string | Required |
| `description` | string | Short blurb |
| `coverPhotoId` | string \| number \| null | Optional photo id for cover |
| `publishedAt` | ISO date string | Sort/display |
| `photoIds` | (string\|number)[] | Ordered membership |
| `draft` | boolean | Hidden from public when true |
| `content` | string \| null | Optional long-form body (markdown/HTML plaintext) |
| `createdAt` / `updatedAt` | ISO | Audit |

No separate numeric gallery id in U6 (Q1=A).

---

## PublicGalleryDTO

Public projection of GalleryRecord plus optional resolved photo summaries for tiles:

| Field | Notes |
|-------|--------|
| `slug`, `title`, `description`, `publishedAt`, `coverPhotoId` | |
| `photos` | Ordered PublicPhoto (or lite summary) for membership that still exist |
| Omits | Internal-only fields if any; draft galleries not returned on public GETs |

---

## GalleryMembershipEdit (admin form)

| Field | Notes |
|-------|--------|
| `photoIdsText` or ordered list UI | Add/remove/reorder by photo id; save replaces `photoIds` array |
| `title`, `description`, `slug` (create), `coverPhotoId`, `draft` | |
