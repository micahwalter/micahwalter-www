# U5 — Frontend Components

**Preserve** `/upload` visual language (cream/charcoal, existing unlock UX).

---

## `lib/photos-api.ts` (extend)

| Export | Behavior |
|--------|----------|
| `updatePhoto(id, patch, token)` | `PATCH /{id}` with auth; return PublicPhoto |
| Session helpers (optional) | `getAdminToken` / `setAdminToken` / `clearAdminToken` via sessionStorage |
| Existing | `authWithPasscode`, `getPhoto`, `listPhotos`, upload helpers |

---

## Upload hub evolution (`app/upload/`)

| Piece | Responsibility |
|-------|----------------|
| Hub shell / tabs | **Upload** \| **Edit** (galleries later U6) |
| `PhotoEditPanel` | List recent photos + editor form for selected/id |
| `PhotoEditForm` | Fields: title, caption, tags (comma), featured; Save/Cancel |
| Unlock | Reuse passcode gate; persist token to sessionStorage |

Route shape (Code Gen may pick one): `/upload?edit=<id>` or `/upload/edit/[id]` — must be deep-linkable from detail.

---

## Detail shortcut (`ApiPhotoDetail`)

| Change | Behavior |
|--------|----------|
| Edit control | Visible when token present **or** offers unlock-then-navigate |
| Action | Navigate to hub editor with current photo id |
| No PATCH | Detail page does not host the full form in U5 |

---

## Component → API

| UI | Endpoints |
|----|-----------|
| Unlock | `POST /auth` |
| Hub list | `GET /` (list) |
| Load form | `GET /{id}` |
| Save | `PATCH /{id}` |
