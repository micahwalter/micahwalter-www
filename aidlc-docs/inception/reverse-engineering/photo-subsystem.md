# Photo Subsystem — Reverse Engineering Supplement

**Analysis Date**: 2026-07-16T15:25:00Z  
**Scope**: Photo content model, upload pipeline, AI tagging, display surfaces  
**Related issues**: [#103](https://github.com/micahwalter/micahwalter-www/issues/103), [#104](https://github.com/micahwalter/micahwalter-www/issues/104), [#71](https://github.com/micahwalter/micahwalter-www/issues/71)  
**Note**: Site-wide RE artifacts dated 2026-06-24 predate the photo-upload and ticket-server stacks. This supplement is the current source of truth for photo-related architecture.

---

## Business Context

Photos are a first-class publishing type on micahwalter.com: capture → enrich → publish → browse. Today metadata lives in git markdown; binaries live on S3/CDN. Publishing a photo requires a full static site rebuild even though images are already on the CDN.

### Business Transactions

| Transaction | Actor | Current path |
|-------------|-------|--------------|
| Upload photo (web) | Site owner | `/upload` → API → S3 → process Lambda → GitHub commit `index.md` → deploy |
| Import photo (CLI) | Site owner | `blog photos:import` → local markdown → `blog images:sync` → git push → deploy |
| AI tag photo (CLI) | Site owner | `blog photos:tag` → Bedrock Claude Vision → update frontmatter tags |
| Browse photos | Visitor | `/photos`, homepage hero/recent, `/posts/<id>` |
| Feature on homepage | Site owner | `featured: true` in frontmatter; newest featured wins |

---

## Current Architecture

```text
  /upload form                         blog photos:import / photos:tag
       |                                         |
       v                                         v
  api.micahwalter.com/photos              local content/posts/.../index.md
  (auth, upload-url)                              |
       |                                          |
       v                                          v
  S3 uploads bucket ----ObjectCreated----> process Lambda
       |                                      |
       |                         +------------+------------+
       |                         |            |            |
       |                         v            v            v
       |                      EXIF       optimize      tickets API
       |                    (no GPS)    -> images     (post_tickets)
       |                         |         bucket          |
       |                         +-----+------+------------+
       |                               |
       |                               v
       |                        GitHub commit index.md
       |                               |
       |                               v
       |                        Full site rebuild (deploy.yml)
       |                               |
       +-------------------------------v
                    CloudFront www
                    /posts/<id>  /photos  /  /images/*
```

### Text alternative

1. Web upload authenticates, gets a presigned PUT URL, uploads bytes to the uploads bucket.
2. Process Lambda extracts EXIF (camera/settings/date — **not GPS**), optimizes variants, allocates an `id` via tickets API, commits markdown to GitHub.
3. Push to `main` triggers full Next.js static export + S3 sync + CloudFront invalidation.
4. CLI import writes markdown locally; AI tagging is a separate Bedrock step; images sync to S3 independently.

---

## Content Model

| Field | Source today | Notes |
|-------|--------------|-------|
| `type: photo` | Frontmatter | Discriminator in `lib/content.ts` |
| `id` | Ticket server | Public URL slug: `/posts/<id>` |
| `title` | Upload metadata or filename | Web form supports title |
| `excerpt` | Auto (“Photo taken with …”) | Not a real caption |
| `description` / `caption` | **Missing** | Proposed in #104 |
| `featured` | Upload / frontmatter | Homepage hero eligibility |
| `tags` | Default `photography`; AI via CLI | Not automatic on web upload |
| `location` | Optional text | Rarely set; no map |
| GPS lat/lon | **Not extracted** | `exif.js` omits GPS tags |
| EXIF (camera, lens, …) | Process / import | Shown in `ExifDisplay` |
| `folderName` | `YYYY-MM-DD-<slug>` | Image CDN key path |
| `coverImage` | `./photo.jpeg` | Relative; UI resolves via folderName |

**Counts (2026-07-16):** ~43 photo posts of ~157 total posts in `content/posts/`.

---

## Components & APIs

| Piece | Path / name | Role |
|-------|-------------|------|
| Upload UI | `app/upload/UploadForm.tsx` | Single file; title + featured only |
| Photo detail | `app/posts/[slug]` + `PhotoLayout` | Static HTML at build time |
| Listings | `app/photos`, `app/page` | `getPhotos()` / `getFeaturedPhoto()` |
| Content loader | `lib/content.ts` | Filesystem markdown |
| Auth / init / process | `infra/photo-upload-lambdas/` | Stack `micahwalter-photo-upload` |
| Tickets | `infra/tickets.yml`, `post_tickets` | Shared sequential IDs |
| AI tags | `scripts/tag-photos.js` | Bedrock `us.anthropic.claude-sonnet-4-6` |
| Images | `micahwalter-www-images` | Originals + 400/800/1200 WebP/JPEG |
| Site hosting | S3 + CloudFront | `output: "export"` — no SSR |

### Photo upload API (today)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/photos/auth` | Passcode → HMAC token |
| POST | `/photos/upload-url` | Presigned PUT + metadata (title, featured) |
| (S3 event) | process Lambda | EXIF, optimize, ticket, GitHub commit |

**Gap:** No public read API for photo metadata. No DynamoDB photo table. No multi-file upload. No caption field. No GPS/map. No Bedrock in process Lambda.

---

## Pain Points (drive #103 / #104)

1. **Publish latency** — metadata commit forces full static rebuild (~minutes) though images are already live.
2. **Content clutter** — 43 photo folders in `content/posts/` for structured records.
3. **Upload UX** — single file; no caption; no batch.
4. **Enrichment split** — AI tags only via CLI; GPS unused; no map UI.
5. **Static export constraint** — true dynamic Next routes need hybrid hosting or API-backed pages.

---

## Reusable Building Blocks for Migration

- Numeric `id` as public slug (stable URLs)
- Existing `/photos` write API + `api.micahwalter.com` domain
- Ticket counter (`post_tickets`)
- Image CDN layout (can keep `folderName` keys initially)
- Proven Bedrock tagging prompt/logic in `scripts/tag-photos.js`
- Newsletter DynamoDB patterns as reference for table/API design
- CloudFront path behaviors already split `/images/*`

---

## Key Files Index

| Area | Paths |
|------|--------|
| Content | `lib/content.ts`, `lib/galleries.ts`, `content/posts/*/index.md` |
| UI | `app/upload/`, `app/photos/`, `app/posts/[slug]/`, `components/PhotoLayout.tsx`, `ExifDisplay.tsx`, `ResponsiveImage.tsx` |
| Upload | `infra/photo-upload-lambdas/src/{auth,init,process}.js`, `lib/exif.js` |
| AI | `scripts/tag-photos.js`, `cli/index.js` (`photos:tag`) |
| Infra | `infra/photo-upload.yml`, `infra/tickets.yml`, `infra/infra.yml`, `infra/api-domain.yml` |
| Deploy | `.github/workflows/deploy.yml`, `photo-upload-deploy.yml` |
| Prior construction | `aidlc-docs/construction/issue-71-photo-upload-summary.md` |
