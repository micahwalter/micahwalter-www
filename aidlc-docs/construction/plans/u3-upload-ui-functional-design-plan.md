# U3 — Upload UI — Functional Design Plan

**Unit**: U3 Upload UI (light)  
**Stories**: US-001  
**Components**: PhotoAdminUI (upload), `lib/photos-api.ts` helpers as needed  
**Construction note**: Functional Design (light) → Code Generation; **skip NFR Design / Infrastructure Design** unless answers require new env/API infra (init already supports caption)

Please answer every `[Answer]:` below (or reply in chat `1A 2A …`).

---

## Plan checklist

- [ ] Collect answers
- [ ] Resolve ambiguities
- [ ] Generate FD artifacts (domain/business light + frontend-components)
- [ ] Present Functional Design completion (Continue → Code Generation plan)

---

## Questions

### Question 1 — Multi-file upload concurrency

A) **Parallel uploads** — after unlock, queue all selected files; upload N at a time (e.g. concurrency 3) with per-file progress

B) **Sequential** — upload one file at a time in selection order (simpler; slower for batches)

X) Other (please describe after [Answer]: tag below)

[Answer]: 

---



### Question 2 — Max files per session

A) **Soft cap 20** files per selection (warn/reject over cap)

B) **Soft cap 50**

C) **No hard cap** — browser/memory practical limits only

X) Other (please describe after [Answer]: tag below)

[Answer]: 

---



### Question 3 — Client API helper location

A) **Add `lib/photos-api.ts`** now with auth + `getUploadUrl` (+ types); UploadForm uses it (foundation for U4/U5)

B) **Keep fetch inline in UploadForm** for U3; introduce `lib/photos-api.ts` in U4

X) Other (please describe after [Answer]: tag below)

[Answer]: 

---



### Question 4 — Per-file metadata UI

A) **List of rows** — thumbnail/name + title + caption + featured checkbox + progress/status per file

B) **Compact list** — title + featured required; caption in expandable row

X) Other (please describe after [Answer]: tag below)

[Answer]: 

---



### Question 5 — After a file succeeds

A) **Stay on form** — mark that row done; allow more uploads / clear done rows; show link hint that photo will appear via API (no site deploy)

B) **Navigate away** — redirect to `/photos` or homepage after entire batch completes

C) **A + optional** “View when ready” note only (no redirect)

X) Other (please describe after [Answer]: tag below)

[Answer]: 

---



### Question 6 — File type UX

A) **JPEG/PNG only** (match API); reject others in the picker with a clear message (HEIC still relies on iOS→JPEG as today)

B) **Accept image/* in picker** but still reject non JPEG/PNG before upload-url with message

X) Other (please describe after [Answer]: tag below)

[Answer]: 

---



### Question 7 — Title defaults in UI

A) **Pre-fill title** from filename (sans extension) per file; user can edit before upload

B) **Leave title blank** — server/process applies filename default if empty

X) Other (please describe after [Answer]: tag below)

[Answer]: 

---



### Question 8 — Scope of `/upload` page in U3

A) **Upload section only** — keep page focused on multi-upload (+ existing unlock); edit/gallery hub sections wait for U5/U6

B) **Stub hub chrome** — tabs/sections for Upload | Edit | Galleries with Edit/Galleries “coming soon”

X) Other (please describe after [Answer]: tag below)

[Answer]: 

---
