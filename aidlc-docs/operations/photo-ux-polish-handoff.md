# Operations Handoff — Photo UX Polish

**Status:** Complete — shipped to production  
**PR:** [#115](https://github.com/micahwalter/micahwalter-www/pull/115) (merged)  
**Engagement:** Post-cutover photo UX polish (map, tags, homepage skeleton, galleries layout)  
**Stories:** US-1 … US-5  

## Operations phase note

AI-DLC **Operations** is a placeholder (no automated deploy/monitor workflows in-tool).  
This engagement’s site changes shipped via the normal `deploy.yml` path after merge. User confirmed production looks good (2026-07-17).

## What shipped

| Item | Live behavior |
|------|----------------|
| Photo map | OSM embed + place label on detail when public coords / city exist |
| Tags | Click → `/photos?tag=…` filtered grid |
| Homepage | Featured image skeleton while API loads |
| Galleries | Detail grid inside `max-w-wide` margins |
| Bare `GET /photos` | Still 404 without trailing slash (known ApiMapping limit); site uses `/photos/` |

## Build & test reference

`aidlc-docs/construction/build-and-test/photo-ux-polish/`

## Smoke (optional re-check)

```bash
curl -sS -o /dev/null -w "options:%{http_code}\n" -X OPTIONS \
  "https://api.micahwalter.com/photos/auth" \
  -H "Origin: https://www.micahwalter.com" \
  -H "Access-Control-Request-Method: POST"

# Browser: /photos/171 (map), tag click, /, /galleries/<slug>
```

## Follow-ups (out of scope / backlog)

- CloudFront (or similar) rewrite if third parties must call bare `GET /photos` without a trailing slash  
- Server-side `tag` query on the photos API if the library grows beyond client prefetch  
- Build-time bake of featured photo (rejected for this engagement; revisit if desired)

## Rollback

Revert / redeploy prior site commit from `main` history (UI-only; no DynamoDB migration in this engagement).
