# U6 — Business Logic Model (Galleries)

**Stories**: US-011, US-012  
**Decisions**: Slug PK; ordered id list editor; migrate in U6; client fetch; draft support; no delete.

---

## Data flow

```text
Admin (/upload Galleries tab)
  -> auth token
  -> GalleryAdmin API (create/rename/setMembership)
  -> DynamoDB galleries table

Visitor /galleries, /galleries/[slug]
  -> static shell
  -> client fetch GalleryQuery API
  -> resolve photoIds via Photo GET/list batch
  -> render tiles -> /photos/<id>

Migration (U6)
  content/galleries/*/index.md -> putGallery (idempotent by slug)
```

---

## Flows

### F1 — Create gallery (admin)

1. Unlock hub → Galleries tab.  
2. Enter title, slug (validate URL-safe unique), description, draft, optional cover id.  
3. `POST` create → DynamoDB.  
4. Optionally set membership immediately (F2).

### F2 — Edit membership

1. Select gallery → show ordered photo ids.  
2. Add id, remove, move up/down.  
3. Save → `setMembership` replaces `photoIds`.  
4. Invalid/empty ids rejected or stripped on save.

### F3 — Rename / metadata

1. Patch title, description, coverPhotoId, draft, publishedAt as allowed.  
2. Slug rename: either disallow in U6 or support with uniqueness check (prefer **slug immutable after create** unless cheap — document in Code Gen: default immutable slug).

### F4 — Public gallery index / detail

1. Client `listGalleries` / `getGallery(slug)` (public; drafts excluded).  
2. For detail, resolve each photoId via photo API (batch or sequential with modest concurrency).  
3. Skip missing photos; link to `/photos/<id>`.

### F5 — Migrate markdown

1. Read each `content/galleries/*/index.md`.  
2. Map frontmatter → GalleryRecord.  
3. `putGallery` upsert by slug (re-runnable).  
4. Do not delete markdown files in U6 (cleanup can wait for U7 if desired).

---

## Out of scope

- Gallery delete  
- Drag-and-drop picker  
- Multi-region galleries table (follow photos posture in Infra/U7)  
- Photo markdown migration (U7)
