# Construction summary — Issue #143 Social preview images

## What shipped

Share crawlers (LinkedIn, Slack, Twitter, iMessage, etc.) now get a large preview image instead of a title-only card.

1. **Static pages (Next.js)**  
   `lib/seo.ts` plus `metadataBase` so indexes, posts, sketches, emails, micro, about, newsletter, and archives emit `og:image` and `twitter:card=summary_large_image`.  
   Fallback image: `/share-card.jpg` (1200×630). Blog covers still use `{cover}-1200.jpg`. Coverless posts use the share card.

2. **API-backed URLs**  
   Photo, Exposure, and gallery **detail** pages stay SPA shells for browsers. The CloudFront Function rewrites known crawler User-Agents to `og/*.html` in the website bucket.  
   The hourly feed-publisher (plus best-effort writes from process/orchestrator) generates those files with the real photograph URL.

3. **Deploy**  
   Site sync `--delete` excludes `og/photos/*`, `og/exposures/*`, and `og/galleries/*` so generated per-item HTML is not wiped on each site deploy. Index files `public/og/{home,photos,exposures,galleries}.html` ship with the site as crawler fallbacks until the publisher overwrites them with live photos.

## Verification

- `node --test` og-html + share-crawler + existing photo-api route tests: pass
- `npm run build`: pass (336 static pages)
- Built `out/exposures.html` includes `og:image` → `share-card.jpg` and `twitter:card=summary_large_image`
- Built post with cover still points at `cover-1200.jpg`
- CloudFront Function source ~7.4KB (under the 10KB limit)

## Deploy order after merge

1. Photo-upload stack (feed-publisher IAM/env + process/orchestrator OG writes)
2. Infra stack (CloudFront Function crawler rewrite)
3. Site deploy (metadata + share-card + fallback `og/*.html`)
4. Invoke `photo-upload-feed-publisher` once (or wait up to an hour) so `/photos/{id}` and `/exposures/{n}` crawler HTML uses the actual photographs

## LinkedIn check

After the stacks and site are live, run [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) on `https://www.micahwalter.com/exposures` and a photo URL.
