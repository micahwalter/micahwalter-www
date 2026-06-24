# API Documentation

## Overview

The static site has **no server-side API routes** (Next.js `output: "export"` prohibits `/app/api/*`). All external APIs are:

1. **Newsletter HTTP API** — Go Lambdas behind API Gateway at `api.micahwalter.com/newsletter`
2. **Internal build-time interfaces** — Node.js lib modules reading filesystem content
3. **Third-party APIs** — Mastodon (prebuild), Fathom Analytics (client), AWS Bedrock (authoring scripts)

## REST APIs — Newsletter (API Gateway)

Base URL: `https://api.micahwalter.com/newsletter` (configured via `NEXT_PUBLIC_NEWSLETTER_API_URL` at build time)

### GET /formtoken

- **Purpose**: Issue a short-lived form token for subscribe CSRF protection
- **Request**: No body; CORS-enabled GET
- **Response**: JSON with `formToken` string
- **Consumer**: `components/SubscribeForm.tsx`

### POST /subscribe

- **Purpose**: Register a new newsletter subscriber (double opt-in)
- **Request**:
  ```json
  {
    "email": "user@example.com",
    "name": "Optional Name",
    "website": "",
    "formToken": "token-from-formtoken"
  }
  ```
- **Validation**:
  - `website` honeypot must be empty (bot rejection)
  - `formToken` must be valid and unexpired
  - Email format validation
- **Response**: 200 on success; 400/500 on error
- **Side effects**: Creates PENDING subscriber in DynamoDB; emits `SignupRequested` EventBridge event → confirmation email via SES

### POST /confirm

- **Purpose**: Activate subscriber after email confirmation link click
- **Request**:
  ```json
  {
    "token": "signed-hmac-token-from-email"
  }
  ```
- **Response**: 200 on success; 400 if token invalid/expired
- **Side effects**: Updates subscriber status PENDING → ACTIVE; may notify admin
- **Consumer**: `components/ConfirmHandler.tsx`

### POST /unsubscribe

- **Purpose**: Remove subscriber via signed token link
- **Request**:
  ```json
  {
    "token": "signed-hmac-unsubscribe-token"
  }
  ```
- **Response**: 200 on success
- **Side effects**: Updates subscriber status to unsubscribed
- **Consumer**: `components/UnsubscribeForm.tsx`

### GET /health

- **Purpose**: Health check for Route53 failover routing
- **Request**: No body
- **Response**: 200 with health status
- **Consumer**: AWS Route53 health checks

## EventBridge API (Internal)

### NewsletterSendRequested

- **Source**: `newsletter.campaigns`
- **Emitter**: `scripts/email-send.js` via `blog email:send <slug>`
- **Payload** (`internal/events/events.go`):
  - Campaign/post ID
  - Rendered HTML and plain text content
  - Subject line
  - View-in-browser URL
- **Consumer**: SQS → dispatch Lambda

### SignupRequested

- **Source**: Newsletter event bus
- **Emitter**: subscribe Lambda
- **Consumer**: email Lambda → SES confirmation email

## Internal APIs — Content Layer (`lib/`)

### `lib/content.ts`

| Function | Signature | Return | Purpose |
|----------|-----------|--------|---------|
| `getAllPosts` | `()` | `Post[]` | All posts (blog + photo + email), draft-filtered in production |
| `getSortedPosts` | `()` | `Post[]` | Posts sorted by publishedAt descending |
| `getPostBySlug` | `(slug: string)` | `Post \| undefined` | Single post lookup |
| `getBlogPosts` | `()` | `Post[]` | Filter `type !== 'photo' && type !== 'email'` |
| `getPhotos` | `()` | `Post[]` | Filter `type === 'photo'` |
| `getEmailPosts` | `()` | `Post[]` | Filter `type === 'email'` |
| `getPostsByCategory` | `(category: string)` | `Post[]` | Category filter |
| `getPostsByTag` | `(tag: string)` | `Post[]` | Tag filter |
| `getPostsByYear` | `(year: string)` | `Post[]` | Year archive |
| `getPostsByMonth` | `(year, month)` | `Post[]` | Month archive |
| `getPaginatedPosts` | `(page, perPage)` | `{ posts, totalPages, currentPage }` | Pagination |
| `getAllCategories` | `()` | `string[]` | Unique categories |
| `getAllTags` | `()` | `string[]` | Unique tags |
| `getAllYears` | `()` | `string[]` | Unique years |
| `getAllPostSlugs` | `()` | `string[]` | All slugs for static params |

### `Post` Interface

```typescript
interface Post {
  slug: string;
  id?: string;
  folderName: string;
  title: string;
  publishedAt: string;
  excerpt: string;
  category: string;
  tags: string[];
  coverImage?: string;
  thumbnailUrl?: string;
  draft: boolean;
  content: string;
  type?: 'blog' | 'photo' | 'email';
  camera?: string;
  lens?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: string;
  focalLength?: string;
  dateTaken?: string;
  location?: string;
}
```

### `lib/galleries.ts`

| Function | Purpose |
|----------|---------|
| `getAllGalleries()` | List all gallery MDX entries |
| `getGalleryBySlug(slug)` | Single gallery with photo ID references |
| `getGalleryPhotos(gallery)` | Resolve photo posts by frontmatter IDs |

### `lib/sketches.ts`

| Function | Purpose |
|----------|---------|
| `getSortedSketches()` | All sketches sorted by date |
| `getSketchBySlug(slug)` | Single sketch with type (html/image/p5js) |

### `lib/mastodon.ts`

| Function | Purpose |
|----------|---------|
| `getToots()` | Read all toots from `public/mastodon.json` |
| `getTootById(id)` | Single toot lookup |

## Data Models

### DynamoDB — newsletter_subscribers

| Field | Type | Description |
|-------|------|-------------|
| `email` | String (PK) | Subscriber email address |
| `status` | String | PENDING, ACTIVE, or unsubscribed |
| `name` | String | Optional display name |
| `subscribedAt` | String | ISO timestamp |
| `confirmedAt` | String | ISO timestamp (when ACTIVE) |

**GSI**: `StatusIndex` on `status` — used by dispatch Lambda to query ACTIVE subscribers

### DynamoDB — newsletter_sends

| Field | Type | Description |
|-------|------|-------------|
| `campaignId` | String (PK) | Email post ID |
| `subscriberEmail` | String (SK) | Subscriber email |
| `status` | String | SENT or FAILED |
| `sentAt` | String | ISO timestamp |

**Purpose**: Idempotency — skip subscribers already sent for a given campaign

### MDX Frontmatter — Blog Post

```yaml
id: 42
title: "Post Title"
publishedAt: "2024-01-15"
excerpt: "Brief summary"
category: "AI"           # AI | AWS | Writing | Photography
tags: ["tag1", "tag2"]
coverImage: "./cover.jpg"
draft: false
```

### MDX Frontmatter — Photo Post

```yaml
type: photo
id: 122                  # Used as URL slug (/posts/122)
title: "..."
publishedAt: "..."
category: "Photography"
camera: "FUJIFILM X-Pro2"
lens: "XF23mmF1.4 R"
aperture: "f/1.4"
# ... additional EXIF fields
```

### MDX Frontmatter — Email Post

```yaml
type: email
id: 142                  # Primary key for newsletter_sends
title: "March 2026"
publishedAt: "2026-03-15"
excerpt: "Archive summary"
draft: false             # Must be false to send
```

### Build-Time Generated Files

| File | Schema | Purpose |
|------|--------|---------|
| `public/posts.json` | `{ slug, title, excerpt, category, tags, publishedAt, thumbnailUrl }[]` | Client search index |
| `public/feed.xml` | RSS 2.0 | Syndication feed |
| `public/sitemap.xml` | XML sitemap | SEO |
| `public/mastodon.json` | Mastodon API toot array | Microblog archive |

## Static Site Routes (No API — Pre-rendered Pages)

All routes under `app/` are statically generated. Key URL patterns:

| Pattern | Content Type |
|---------|-------------|
| `/posts/{slug}` | Blog or photo post |
| `/photos` | Photo grid |
| `/emails/{slug}` | Newsletter archive |
| `/galleries/{slug}` | Photo gallery |
| `/sketches/{slug}` | Interactive sketch |
| `/micro/{id}` | Mastodon toot |
| `/topics/{category}` | Category archive |
| `/tags/{tag}` | Tag archive |
| `/{year}/{month}/{day}/{slug}` | Legacy redirect → `/posts/{slug}` |
