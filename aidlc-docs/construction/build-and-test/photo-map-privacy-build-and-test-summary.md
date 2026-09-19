# Build and Test — Photo Map Privacy

## Unit tests

```bash
cd infra/photo-upload-lambdas && node --test src/lib/*.test.js
```

Result: **32 passed**, 0 failed (includes new `geo.test.js`).

## Site build

```bash
npm run build
```

Result: success (773 static pages). Do not commit `public/mastodon.json` rewrite from prebuild.

## Manual UI (dev)

1. Set `NEXT_PUBLIC_PHOTO_API_URL=https://api.micahwalter.com/photos` in `.env.local`
2. `npm run dev` → http://localhost:3000/photos/183
3. Location section: area OSM embed **without** `marker=`; “Approximate area” label
4. iframe src example:  
   `…/export/embed.html?bbox=-73.776%2C40.751%2C-73.616%2C40.911&layer=mapnik`

Artifacts:
- `/opt/cursor/artifacts/photo_183_location_approximate_area.webp`
- `/opt/cursor/artifacts/photo_map_approximate_area_demo.mp4`

## Post-deploy backfill (ops)

After enricher deploy, force re-enrich GPS photos so public coords become 2 decimals — see `aidlc-docs/construction/photo-map-privacy/backfill-notes.md`.

Until backfill, live API may still return 3-decimal public coords; the UI already uses area framing without a pin.

## Success criteria

- [x] New fuzz = 2 decimals (unit tested)
- [x] Map embed has no marker; larger bbox
- [x] Build + unit tests pass
- [ ] Live backfill of existing photos (after Lambda deploy)
