# Integration / Smoke Tests — photo-ux-polish

## Production status (2026-07-17)
User confirmed PR merged, deployed, and **looks good**. Treat the following as the verification checklist (re-run anytime).

## Scenarios

### S1 — Photo map + place (US-1)
1. Open a photo with GPS enrichment (e.g. `/photos/171`)
2. Expect: OSM embed map visible; place label (e.g. Port Washington, USA)
3. “Open in OpenStreetMap” link works

### S2 — Clickable tags (US-2)
1. On photo detail, click a tag chip
2. Expect: navigate to `/photos?tag=…`
3. Grid shows matching photos; “Clear filter” returns to all photos
4. Unknown tag → empty state (not error)

### S3 — Homepage skeleton (US-3)
1. Hard-refresh `/` (throttle network optional)
2. Expect: aspect-ratio skeleton before featured image (not primary text “Loading photos…”)
3. Featured image appears without large layout collapse

### S4 — Galleries layout (US-4)
1. Open any gallery detail
2. Expect: thumbnails inset with site margins (`max-w-wide` + horizontal padding), not edge-bleeding
3. Lightbox still full-bleed

### S5 — API CORS / list (US-5 related)
```bash
curl -sS -D - -o /dev/null -X OPTIONS \
  "https://api.micahwalter.com/photos/auth" \
  -H "Origin: https://www.micahwalter.com" \
  -H "Access-Control-Request-Method: POST"
# Expect: 204

curl -sS -o /dev/null -w "%{http_code}\n" "https://api.micahwalter.com/photos/"
# Expect: 200

curl -sS -o /dev/null -w "%{http_code}\n" "https://api.micahwalter.com/photos"
# Expect: 404 (known ApiMapping limitation — clients use trailing slash)
```

### S6 — Upload login still works
1. `/upload` unlock with passcode
2. Expect: no CORS “Could not reach the server”
