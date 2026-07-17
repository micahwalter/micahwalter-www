# U6 — Business Rules (Galleries)

| ID | Rule |
|----|------|
| BR-U6-01 | Gallery definitions persist in DynamoDB; markdown is not the source of truth after migration. |
| BR-U6-02 | Primary key is **`slug`** (unique); public URL `/galleries/<slug>`. |
| BR-U6-03 | Create/rename and membership changes require the same passcode → HMAC token as upload/edit. |
| BR-U6-04 | Membership is an **ordered** list of photo ids; save replaces the full array (`setMembership`). |
| BR-U6-05 | Admin UX is an ordered id list editor (add/remove/move up-down) — not drag-picker in U6. |
| BR-U6-06 | Public list/detail **omit draft** galleries; admin can see/edit drafts. |
| BR-U6-07 | Public gallery pages **client-fetch** gallery + resolve photos via photo API; tiles link to `/photos/<id>`. |
| BR-U6-08 | Missing/deleted photo ids in membership are skipped in public render (no broken tiles). |
| BR-U6-09 | Cover photo is optional; when set, must be one of the membership ids (or allow orphan cover — prefer membership member). |
| BR-U6-10 | **No delete gallery** API/UI in U6 (rename + membership + draft only). |
| BR-U6-11 | Migrate existing `content/galleries/*/index.md` into DynamoDB during U6 (idempotent by slug). |
| BR-U6-12 | Unauthenticated users cannot mutate galleries. |
| BR-U6-13 | Hub **Galleries** tab under `/upload` (alongside Upload \| Edit). |
