# U5 — Edit UI — Code Summary

**Story**: US-005  
**Branch**: `cursor/u2-enrichment-functional-design-be02`

## What shipped

| Area | Files |
|------|--------|
| API / session | `lib/photos-api.ts` — `updatePhoto`, `get/set/clearAdminToken`, `parseTagsInput` |
| Hub | `app/upload/UploadHub.tsx` — unlock, session hydrate, Upload \| Edit tabs, Lock |
| Upload | `UploadForm.tsx` — takes `token` + `onSessionExpired` (unlock moved to hub) |
| Edit | `PhotoEditPanel.tsx` — recent list, form, PATCH save |
| Page | `app/upload/page.tsx` — Photos admin copy |
| Detail | `ApiPhotoDetail.tsx` — Edit link when session token present → `/upload?edit=<id>` |

## Manual smoke checklist

- [ ] `.env.local` has `NEXT_PUBLIC_PHOTO_API_URL`
- [ ] `/upload` unlock → Upload tab still works
- [ ] Edit tab lists photos; save title/caption/tags/featured
- [ ] `/upload?edit=<id>` opens Edit with that photo
- [ ] After unlock, `/photos/<id>` shows “Edit photo →”
- [ ] 401 clears session and returns to unlock
- [ ] Public visitor (no token) does not see Edit on detail
- [ ] `npm run build` succeeds

## Out of scope

- Draft, delete, galleries, CLI
