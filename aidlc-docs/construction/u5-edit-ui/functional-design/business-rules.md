# U5 — Business Rules (Edit UI)

| ID | Rule |
|----|------|
| BR-U5-01 | Only authenticated owners (valid passcode → HMAC token) may PATCH photos. |
| BR-U5-02 | Editable fields in U5: **title**, **caption**, **tags**, **featured** only. |
| BR-U5-03 | Title cannot be empty/whitespace on save (align API 400). |
| BR-U5-04 | Tags input is comma-separated text → trimmed string array; empty segments dropped. |
| BR-U5-05 | Hub under `/upload` is the **primary** editor; full form lives there. |
| BR-U5-06 | Public `/photos/[id]` shows an **Edit** control that navigates to the hub editor for that id (after unlock if needed). |
| BR-U5-07 | Hub shows a recent photos list (API) so the owner can pick a photo to edit. |
| BR-U5-08 | Auth token is shared via **sessionStorage** across upload and edit on `/upload` (and unlock for detail shortcut as needed). |
| BR-U5-09 | On 401 from PATCH, clear token and prompt re-auth; do not leave a half-saved local-only state as truth. |
| BR-U5-10 | Successful save updates DynamoDB via API; public pages show changes on next client fetch (no site deploy). |
| BR-U5-11 | Unauthenticated visitors never see working edit controls that call PATCH (hide or no-op without token). |
| BR-U5-12 | No delete-photo, no gallery admin, no CLI in U5. |
| BR-U5-13 | No draft toggle in U5 UI. |
