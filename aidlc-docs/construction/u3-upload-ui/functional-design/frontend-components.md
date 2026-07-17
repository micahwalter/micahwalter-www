# U3 — Frontend Components

**Preserve** existing `/upload` design system (serif/cream/charcoal site patterns already on the page).

---

## UploadForm (evolve existing `app/upload/UploadForm.tsx`)

**Responsibility**: Unlock + multi-file queue UI + upload orchestration  

### State
- `token`, page `phase` (`locked` | `ready`)  
- `items: UploadItem[]`  
- global error banner for auth/network  

### Interactions
1. Unlock form (unchanged auth UX)  
2. Multi `input[type=file]` `multiple` accept `image/jpeg,image/png`  
3. Per-file row: preview/name, title, caption textarea, featured checkbox, status/progress  
4. Primary action: “Upload all pending” (or upload pending only)  
5. Clear done / remove pending row  

### API
Uses `lib/photos-api.ts`:
- `authWithPasscode(passcode)`  
- `getUploadUrl({ token, filename, contentType, title, caption, featured })`  

### Progress
- Per-file status badges: pending / uploading / done / error  
- Prefer `XMLHttpRequest` or `fetch`+ReadableStream if easy for upload progress; else indeterminate “uploading…” is acceptable  

---

## photos-api (new `lib/photos-api.ts`)

**Responsibility**: Typed helpers for photo HTTP API (U3 upload; foundation for U4/U5)

| Export | Behavior |
|--------|----------|
| `getPhotoApiBase()` | `NEXT_PUBLIC_PHOTO_API_URL` |
| `authWithPasscode(passcode)` | POST `/auth` |
| `getUploadUrl(input)` | POST `/upload-url` |

Keep functions small; no React hooks in this module.

---

## Upload page shell (`app/upload/page.tsx`)

- Keep noindex / existing layout copy adjustments only if needed for multi-file wording  
- No hub tabs in U3  
