# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a **static blog built with Next.js 15** using the App Router and exported as static HTML. The site is hosted on AWS S3 + CloudFront with automated GitHub Actions deployment.

### Key Architectural Decisions

1. **Static Export (`output: "export"`)**: The entire site is pre-rendered at build time. This means:
   - No API routes are supported
   - All dynamic data must be generated at build time via scripts
   - Files like `posts.json`, `feed.xml`, and `sitemap.xml` are generated during prebuild
   - Dynamic routes use `generateStaticParams()` to pre-render all pages
   - `output: "export"` is only enabled in production (`NODE_ENV === "production"`). Dev mode uses standard Next.js routing so all slugs are accessible without being in `generateStaticParams`.

2. **Content Management**: MDX-based with gray-matter frontmatter
   - Posts live in `content/posts/YYYY-MM-DD-slug/index.mdx`
   - Slug is derived from folder name (date prefix stripped)
   - Content utilities in `lib/content.ts` handle parsing and filtering
   - Draft posts (frontmatter `draft: true`) are visible in dev, hidden in production

3. **Next.js 15 Pattern**: Dynamic route params are Promises and must be awaited
   ```typescript
   export default async function Page({ params }: Props) {
     const { slug } = await params; // Must await!
   }
   ```

4. **Image Workflow**: Dual-storage system for originals and optimized images
   - Originals: `content/posts/{slug}/*.{jpg,png}` → S3 `originals/posts/{slug}/`
   - Processed: `.optimized-images/posts/{slug}/*-{size}.{webp,jpg}` → S3 `posts/{slug}/`
   - Ensures images persist across machines and builds

## Development Commands

### Blog CLI (Recommended)

The unified `blog` CLI is the primary interface for content and image management. It must be installed globally once:

```bash
npm link  # Makes 'blog' command available globally
```

**Core Commands:**
```bash
blog post:new                    # Create new post with template
blog post:new "Post Title"       # Create with specific title

blog images:optimize             # Process images (400/800/1200px WebP+JPEG)
blog images:upload --profile www # Upload originals + processed to S3
blog images:download             # Download from S3 to local
blog images:sync --profile www   # One command: optimize + upload

blog build:static                # Generate RSS, sitemap, posts.json
blog help                        # Show all commands
blog help images:upload          # Help for specific command
```

### NPM Scripts

```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Production build (runs prebuild automatically)
npm run lint         # ESLint check

# Legacy image scripts (prefer blog CLI)
npm run optimize-images
npm run upload-images:www
```

### Important Flags

- `--profile www` - Use AWS profile "www" for S3 operations
- `--dry-run` - Preview operations without executing
- `--originals-only` / `--processed-only` - Selective image operations

## Content Structure

### Post Folders

```
content/posts/
└── YYYY-MM-DD-slug-name/
    ├── index.mdx         # Post content with frontmatter
    ├── cover.jpg         # Optional cover image
    └── diagram.png       # Additional images
```

### Required Frontmatter

```yaml
---
id: 42                        # Auto-assigned: global sequential post ID
title: "Post Title"           # Required
publishedAt: "2024-01-15"    # Required: YYYY-MM-DD
excerpt: "Brief summary"      # Required
category: "AI"               # Required: "AI", "AWS", or "Writing"
tags: ["tag1", "tag2"]       # Optional
coverImage: "./cover.jpg"    # Optional: relative path
draft: false                 # Optional: true hides in production
---
```

### Post Counter

All posts (blog and photo) share a single global counter stored in `content/post-counter`. Each new post is assigned the next integer `id` regardless of type:

- **Blog posts** (`blog post:new`): `id` is written to frontmatter for reference but the URL slug remains title-based.
- **Photo posts** (`blog photos:import`): `id` is written to frontmatter and also used as the URL slug (e.g. `/posts/42`).

This ensures every post has a stable, unique numeric ID across the entire site.

### Content Filtering

- `getAllPosts()` - Returns all posts, filtering drafts in production only
- `getSortedPosts()` - Posts sorted by publishedAt (newest first)
- `getPostsByCategory(category)` - Filter by category
- `getPostsByTag(tag)` - Filter by tag

## Build Process

The build runs in this order:

1. **Prebuild scripts** (automatic via `prebuild` in package.json):
   - `generate-posts-json.js` → `/public/posts.json` (search index)
   - `generate-rss.js` → `/public/feed.xml`
   - `generate-sitemap.js` → `/public/sitemap.xml`

2. **Next.js build**:
   - Generates static HTML for all routes
   - Outputs to `/out` directory
   - Uses `generateStaticParams()` for dynamic routes

3. **Deployment** (GitHub Actions):
   - Syncs `/out` to S3 with cache headers
   - Invalidates CloudFront cache
   - Takes ~3-4 minutes total

## Code Syntax Highlighting

Uses `rehype-highlight` with a custom theme:
- Import: `highlight.js/styles/atom-one-dark.min.css` (must be first in `globals.css`)
- Custom CSS overrides in `globals.css` ensure readable contrast
- All code blocks (including plain text) use cream text on charcoal background

## Static Export Limitations

Because `output: "export"` is enabled:

- **No API routes**: Cannot use `/app/api/*` routes
- **No dynamic APIs**: No server-side rendering or server actions
- **No empty generateStaticParams**: Returns at least one item or remove the function
- **Generated files must be created at build time**: Use prebuild scripts

## Image Management Workflow

### Local to Production

```bash
# 1. Add image to post folder
cp photo.jpg content/posts/2024-02-12-post/cover.jpg

# 2. Sync everything (optimize + upload)
blog images:sync --profile www
```

### New Machine Setup

```bash
git clone <repo>
npm install
npm link                              # Install blog CLI
blog images:download --profile www    # Download all images
```

### Image Locations

- **Original source**: `content/posts/{slug}/*.{jpg,png}`
- **Optimized output**: `.optimized-images/posts/{slug}/*`
- **S3 originals**: `s3://bucket/images/originals/posts/{slug}/`
- **S3 processed**: `s3://bucket/images/posts/{slug}/`

## Common Patterns

### Creating a New Post

```bash
blog post:new "My New Post"
# Creates: content/posts/YYYY-MM-DD-my-new-post/index.mdx
```

### Testing Draft Posts Locally

Set `draft: true` in frontmatter. The post will appear in `npm run dev` but not in production builds.

### Adding Code Blocks

Use triple backticks with language identifier for syntax highlighting:

````markdown
```javascript
const example = "code";
```
````

For plain text diagrams, use triple backticks without language:

````markdown
```
User → API → Database
```
````

## AWS Profile

All AWS operations use the `www` profile. It is configured as an SSO profile:

```bash
aws configure sso --profile www
# Or verify: aws sts get-caller-identity --profile www
```

## Analytics

Fathom Analytics is added via `components/Fathom.tsx`, included in `app/layout.tsx`. The site ID is set via environment variable:

- **Local dev**: add `NEXT_PUBLIC_FATHOM_SITE_ID=<id>` to `.env.local`
- **Production**: set `NEXT_PUBLIC_FATHOM_SITE_ID` as a GitHub Actions secret (it is baked into the static build at CI time)

## Custom Domain

The site is live at `https://www.micahwalter.com`. Infra managed in `infra/infra.yml`:

- ACM certificate covers `www.micahwalter.com` + `micahwalter.com` (DNS validated via Route53)
- Main CloudFront distribution serves `www.micahwalter.com`
- Apex redirect distribution + CloudFront Function issues 301 `micahwalter.com` → `https://www.micahwalter.com`
- Route53 A + AAAA alias records for both domains

The `infra/infra.yml` stack requires Parameters on deploy:
```bash
aws cloudformation update-stack \
  --stack-name micahwalter-www \
  --template-body file://infra/infra.yml \
  --parameters \
    ParameterKey=HostedZoneId,ParameterValue=<hosted-zone-id> \
    ParameterKey=DomainName,ParameterValue=micahwalter.com \
    ParameterKey=WWWDomainName,ParameterValue=www.micahwalter.com \
  --profile www
```

## Deployment

Push to `main` branch triggers automatic deployment via GitHub Actions. Monitor with:

```bash
gh run list --workflow=deploy.yml
gh run watch
```

## Design System

Defined in `tailwind.config.ts`:

- **Colors**: cream (#fafaf2), charcoal (#191919), gray (#5F5F5F), accent (#F5B684)
- **Typography**: EB Garamond serif (body/headings), system fonts (UI)
- **Max widths**: reading (645px), wide (1340px)
- **Mobile-first**: Responsive breakpoints in components
