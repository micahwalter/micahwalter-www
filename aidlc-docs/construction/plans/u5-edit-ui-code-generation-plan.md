# U5 — Edit UI — Code Generation Plan

**Stories**: US-005  
**Status**: Part 2 complete — awaiting Continue approval

---

## Generation steps

### Step 1 — API + session helpers
- [x] `updatePhoto` PATCH
- [x] sessionStorage get/set/clear admin token
- [x] Unlock persists token; hub hydrates on mount

### Step 2 — Hub shell (Upload | Edit)
- [x] `UploadHub.tsx` — tabs, Lock, `?edit=<id>` deep link
- [x] Page copy → Photos admin

### Step 3 — Photo edit panel
- [x] `PhotoEditPanel.tsx` — list, form, save, 401 handling

### Step 4 — Detail Edit shortcut
- [x] Edit link when session token present → `/upload?edit=<id>`

### Step 5 — Construction summary
- [x] `code-summary.md`

### Step 6 — Local verification
- [x] `npm run build` succeeded (`/upload` 6.6 kB)
- [x] Do not commit `public/mastodon.json`

---

## Approval

Plan approved 2026-07-17. Implementation complete.
