# Photo Map Privacy — Code Summary

## Changes

| Area | File | Change |
|------|------|--------|
| Fuzz | `infra/photo-upload-lambdas/src/lib/geo.js` | Public coords round to **2** decimals (~1.1 km) |
| Tests | `infra/photo-upload-lambdas/src/lib/geo.test.js` | Rounding / null / idempotency |
| Enrich fallback | `infra/photo-upload-lambdas/src/enrich.js` | Re-fuzz from stored private GPS when original missing |
| Map URL | `lib/photos-api.ts` | Larger bbox (`delta=0.08`), **no** `marker=`; browse zoom 11 without mlat/mlon pin |
| Map UI | `components/PhotoStaticMap.tsx` | “Approximate area” copy; accessible title |
| Docs | `infra/photo-upload-lambdas/README.md`, `backfill-notes.md` | Privacy note + force-enrich backfill |

## Requirements covered
- FR-1 / FR-3: 2-decimal public fuzz for new enrichment
- FR-2: Area map without exact pin
- FR-4: Backfill via force enrich (documented; run after deploy)

## Verify
```bash
cd infra/photo-upload-lambdas && node --test src/lib/*.test.js
npm run build
```
