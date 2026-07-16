# U3 — Upload UI — Code Generation Plan

**Stories**: US-001  
**Design inputs**: `aidlc-docs/construction/u3-upload-ui/functional-design/`  
**Code location**: `lib/photos-api.ts`, `app/upload/UploadForm.tsx`, `app/upload/page.tsx`  
**Approach**: Brownfield — evolve existing UploadForm; add photos-api helpers  

This plan is the **single source of truth** for U3 Code Generation.

---

## Unit context

| Item | Detail |
|------|--------|
| Deliverable | Multi-file `/upload` with per-file title/caption/featured + progress; uses existing auth/upload-url |
| Depends on | U1 APIs (`NEXT_PUBLIC_PHOTO_API_URL`) |
| Skips | NFR Design, Infrastructure Design |

---

## Generation steps

### Step 1 — `lib/photos-api.ts`
- [ ] Add `getPhotoApiBase()`, `authWithPasscode`, `getUploadUrl` with TypeScript types
- [ ] Throw/return structured errors for non-OK (incl. 401)

### Step 2 — Rewrite `UploadForm.tsx` for multi-file
- [ ] Keep unlock UX; switch ready state to item list
- [ ] `input multiple` accept JPEG/PNG; enforce max 20
- [ ] Per-file: title (filename prefill), caption, featured, status/progress
- [ ] Upload pending with concurrency 3 via photos-api + S3 PUT
- [ ] 401 → locked; stay on form after successes; clear/remove controls
- [ ] Preserve existing visual language (cream/charcoal/system-ui labels)

### Step 3 — Update `app/upload/page.tsx` copy
- [ ] Multi-file + caption wording
- [ ] Remove “site rebuilds” messaging; note API/processing (no deploy wait)

### Step 4 — Construction summary
- [ ] `aidlc-docs/construction/u3-upload-ui/code/code-summary.md` + manual smoke checklist

### Step 5 — Local verification
- [ ] Typecheck/dev sanity as environment allows (`npm run build` if feasible)
- [ ] No new test framework

---

## Out of scope

- Edit/gallery hub  
- HEIC support  
- Backend changes (caption already on init)  
- Browse/detail (U4)

---

## Approval

Approve this plan to begin Part 2 implementation.
