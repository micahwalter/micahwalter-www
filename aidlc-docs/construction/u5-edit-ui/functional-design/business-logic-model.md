# U5 — Business Logic Model (Edit UI)

**Story**: US-005  
**Decisions**: Hub editor primary; detail Edit → hub with id; recent list picker; comma tags; shared sessionStorage token; no draft UI.

---

## Flows

### F1 — Unlock admin session

1. Owner enters passcode on `/upload` (existing) or via unlock when using Edit shortcut without token.  
2. `POST /auth` → store token in **sessionStorage**.  
3. Token reused for upload-url and PATCH until 401/clear.

### F2 — Hub: pick photo and edit

1. After unlock, hub shows tabs/sections: **Upload** (U3) | **Edit** (U5).  
2. Edit section: `listPhotos` (paginated) → select photo → load `getPhoto(id)` into form.  
3. Owner edits title, caption, tags (comma text), featured.  
4. Save → `PATCH /{id}` with Bearer/token body per existing API.  
5. On success: show confirmation; form reflects returned PublicPhoto.  
6. On 401: clear session → unlock. On 400: show field error.

### F3 — Detail shortcut

1. On `/photos/[id]`, if session token present (or after quick unlock), show **Edit** link/button.  
2. Navigate to hub editor with that id (e.g. `/upload?edit=<id>` or `/upload/edit/[id]`).  
3. Form loads that photo; save as F2.

### F4 — Public reflection

1. After PATCH, visitor (or owner) reloads/refetches homepage/`/photos`/detail → sees new metadata.  
2. No GitHub commit; no static rebuild required.

---

## Out of scope

- Draft toggle, delete, geo edits, re-enrich triggers  
- Gallery admin (U6)  
- CLI update/retag (U7 / US-006)
