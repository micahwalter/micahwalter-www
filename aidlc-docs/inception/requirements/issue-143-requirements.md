# Requirements — Issue #143 Social preview images

| Field | Value |
|-------|--------|
| **Issue** | [#143](https://github.com/micahwalter/micahwalter-www/issues/143) — Social preview images for posts, photos, and index pages |
| **User request** | Good, dynamic preview images when sharing posts, photos, and index pages (especially `/exposures`) on LinkedIn and similar |
| **Request type** | Enhancement (Open Graph / Twitter Card metadata) |
| **Depth** | Standard |
| **Scope** | Next.js metadata, default share card, CloudFront crawler rewrite, feed-publisher OG HTML |

## Intent analysis

- **Clarity**: Clear. Motivating example is `/exposures` with no `og:image`.
- **Complexity**: Moderate. MDX blog covers already work at build time. Photo / Exposure / gallery **detail** URLs are one static SPA shell, so crawlers never see the photograph unless we serve different HTML to bots.
- **Brownfield**: Yes. Static export + CloudFront Function already rewrites `/photos/{id}` to `/photos/0.html`.

## Functional requirements

### FR-1 — Index and listing pages

1. `/`, `/photos`, `/exposures`, `/posts`, `/galleries`, `/sketches`, `/emails`, `/micro`, `/about`, `/newsletter`, and `/colophon` emit `og:image` and `twitter:card = summary_large_image`.
2. `/exposures` is the motivating case: a large preview image, not title-only.
3. Prefer a real photograph when the feed-publisher can choose one (featured / latest Exposure / latest photo). Until that HTML exists, a site-wide share card is acceptable so crawlers never 404.

### FR-2 — Blog posts

1. Keep cover `-1200.jpg` when `coverImage` is set.
2. Posts without a cover use the site share card (not a small `summary` card).

### FR-3 — Individual photos, Exposures, galleries

1. Sharing `/photos/{id}` shows **that** photo, with title and caption.
2. Sharing `/exposures/{n}` shows **that** issue’s photograph, with issue number and title.
3. Sharing `/galleries/{slug}` shows the gallery cover photo when one exists.
4. Social crawlers must not need to execute client JavaScript.

### FR-4 — Card hygiene

1. `og:url` matches the shared path on `https://www.micahwalter.com`.
2. Image URLs are absolute HTTPS, publicly fetchable (`/images/posts/...-1200.jpg` or `/share-card.jpg`).
3. Page titles should not double-suffix (`Exposures | Micah Walter`, not `Exposures - Micah Walter | Micah Walter`).

## Non-functional

- Personal-scale: hourly feed-publisher plus best-effort write on photo process / Exposure send is enough freshness.
- LinkedIn / Facebook / Twitter / Slack / iMessage bots are in scope.
- Googlebot may receive the same OG HTML (indexable content with canonical to the public URL).
- Site deploy must not delete generated `og/photos/*`, `og/exposures/*`, `og/galleries/*` objects (`s3 sync --delete`).

## Out of scope

- Redesigning in-page layouts
- Newsletter HTML email cards (already embed the photo)
- Admin `/upload`
- Generating collage / 1.91:1 branded cards per page (use the 1200px photograph or the site share card)

## Acceptance

- [ ] LinkedIn Post Inspector (or raw `og:image` in HTML) for `/exposures` shows a large image
- [ ] `/photos/{id}` and `/exposures/{n}` crawler HTML shows that photograph
- [ ] Blog posts with covers unchanged; coverless posts get the share card
- [ ] `twitter:card` is `summary_large_image` when an image is present
- [ ] `npm run build` succeeds

## Extensions

Security / resiliency / property-based testing remain **disabled** (project-level decision).
