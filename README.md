# Micah Walter's Website

A modern, statically-exported blog and photo archive built with Next.js 15 and hosted on AWS S3 + CloudFront with automated CI/CD deployment.

## Architecture

```mermaid
flowchart TD
    Visitor([Visitor]) --> R53[Route53 DNS]

    R53 -->|www.micahwalter.com| CFMain[CloudFront Main Distribution]
    R53 -->|micahwalter.com| CFApex[CloudFront Apex Redirect]
    CFApex -->|301 to www| CFMain

    CFMain -->|HTML / CSS / JS| S3Web[(S3 Website Bucket)]
    CFMain -->|Images| S3Img[(S3 Images Bucket)]

    Dev([Developer]) -->|git push| GH[GitHub]
    Dev -->|blog images:sync| S3Img
    GH -->|GitHub Actions CI/CD| Build[Next.js Static Build]
    Build -->|sync out/| S3Web
    Build -->|invalidate cache| CFMain

    classDef people fill:#F5B684,stroke:#c47d3e,color:#191919
    classDef dns fill:#c9e6f0,stroke:#5ba3be,color:#191919
    classDef cdn fill:#b3d9f5,stroke:#3a8fc7,color:#191919
    classDef storage fill:#c8f0d8,stroke:#3da85e,color:#191919
    classDef cicd fill:#e0d4f5,stroke:#8a5ec7,color:#191919

    class Visitor,Dev people
    class R53 dns
    class CFMain,CFApex cdn
    class S3Web,S3Img storage
    class GH,Build cicd
```

## Tech Stack

### Frontend
- **Next.js 15**: React framework with App Router and static export
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling with custom design system
- **MDX**: Markdown content with React components via next-mdx-remote
- **EB Garamond & Beiruti**: Google Fonts for editorial typography
- **Rehype Highlight**: Syntax highlighting for code blocks

### Infrastructure
- **AWS S3**: Static file storage with versioning and encryption
- **CloudFront**: Global CDN with HTTP/2, HTTP/3, and edge caching
- **CloudFront Functions**: SPA routing/path rewriting + apex domain redirect
- **Route 53**: DNS management with A/AAAA alias records
- **ACM**: SSL/TLS certificates (DNS validated)
- **GitHub Actions**: CI/CD with OIDC authentication (no stored credentials)
- **Fathom Analytics**: Privacy-first analytics via `fathom-client`

### Image Processing
- **Sharp**: High-performance image optimization
- **WebP + JPEG**: Modern format with fallback support
- **Responsive Images**: Multiple sizes (400px, 800px, 1200px)
- **S3 Dual Storage**: Originals and optimized versions backed up

## Quick Start

### Prerequisites

- Node.js 20+
- AWS CLI configured with profile `www`
- Git and GitHub CLI (optional, for deployments)

### Local Development

```bash
# Clone the repository
git clone <repository-url>
cd micahwalter-www

# Install dependencies
npm install

# Link the blog CLI globally
npm link

# Download images from S3 (first time setup)
blog images:download --profile www

# Start development server
npm run dev

# Open http://localhost:3000
```

### Production Build

```bash
# Build static site (includes prebuild scripts)
npm run build

# Preview production build
npx serve out/
```

## Blog CLI Tool

The unified `blog` CLI manages all content and image operations. It must be linked globally once with `npm link`.

### Available Commands

| Command | Description |
|---------|-------------|
| `blog help` | Show all commands and usage |
| `blog help <command>` | Get help for specific command |
| `blog post:new` | Create new post with template |
| `blog post:new "Title"` | Create post with title (skip prompt) |
| `blog photos:import <dir>` | Import photos with EXIF extraction |
| `blog photos:tag <folder>` | AI-powered photo tagging with Claude Vision |
| `blog photos:tag --all` | Tag all photos with AI suggestions |
| `blog images:optimize` | Process images (400/800/1200px WebP+JPEG) |
| `blog images:upload` | Upload originals + processed to S3 |
| `blog images:download` | Download from S3 to local |
| `blog images:sync` | Optimize + Upload (one command) |
| `blog images:copy-local` | Copy optimized images to public/ for dev |
| `blog build` | Optimize images + copy to public/ (local dev) |
| `blog build:static` | Generate RSS, sitemap, posts.json |

### Common Flags

- `--dry-run` - Preview operations without executing
- `--profile <name>` - Use specific AWS profile (e.g., `www`)
- `--originals-only` - Only work with original images
- `--processed-only` - Only work with optimized images

### Examples

```bash
# Create a new blog post
blog post:new "Building Modern Web Apps"

# Preview what would be uploaded
blog images:upload --dry-run --profile www

# Complete workflow: optimize + upload
blog images:sync --profile www

# Download only original images
blog images:download --originals-only --profile www
```

## Content Management

### Creating Blog Posts

Posts are MDX files stored in `content/posts/` with date-prefixed folder names.

#### Using the CLI (Recommended)

```bash
# Interactive mode (prompts for all fields)
blog post:new

# With title argument
blog post:new "My Awesome Blog Post"
```

This creates:
- `content/posts/YYYY-MM-DD-slug/index.mdx` with frontmatter template
- Post starts with `draft: true` by default
- Visible in dev mode, hidden in production builds

#### Manual Creation

Create a folder: `content/posts/2024-01-15-my-post-title/`

Create `index.mdx` with frontmatter:

```yaml
---
id: 42
title: "My Post Title"
publishedAt: "2024-01-15"
excerpt: "A brief description that appears in listings and SEO."
category: "AI"  # or "AWS", "Writing"
tags: ["tag1", "tag2", "tag3"]
coverImage: "./cover.jpg"  # optional
draft: false
---

Your post content here in markdown/MDX format.

## Heading 2

Regular markdown features work:
- Lists
- **Bold** and *italic*
- [Links](https://example.com)
- Code blocks with syntax highlighting

```javascript
const example = "code";
```

You can also use JSX components if needed.

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `id` | ✅ | Auto-assigned global sequential ID (set by `blog post:new` or `blog photos:import`) |
| `title` | ✅ | Post title for display and SEO |
| `publishedAt` | ✅ | Publication date (YYYY-MM-DD) |
| `excerpt` | ✅ | Brief summary for listings and SEO |
| `category` | ✅ | One of "AI", "AWS", or "Writing" |
| `tags` | ❌ | Array of tag strings |
| `coverImage` | ❌ | Relative path to cover image |
| `draft` | ❌ | Set `true` to hide in production |

### Content Structure

```
content/
└── posts/
    ├── 2024-01-15-building-ai-agents/
    │   ├── index.mdx
    │   └── cover.jpg
    ├── 2024-02-03-serverless-architecture/
    │   ├── index.mdx
    │   ├── cover.jpg
    │   └── diagram.png
    └── ...
```

### Draft Posts

Posts with `draft: true` behave differently in dev vs production:

- **Development** (`npm run dev`): Drafts visible with "DRAFT" badge
- **Production** (`npm run build`): Drafts completely excluded

Set `draft: false` when ready to publish.

## Photo Archive System

The site includes a complete photo archive system with automatic EXIF extraction and AI-powered tagging using Claude Vision API.

### Photo Import with EXIF Extraction

Import photos with automatic metadata extraction from EXIF data:

```bash
# Import photos from a directory
blog photos:import ~/Desktop/photos

# Preview without creating files
blog photos:import ~/Photos/trip --dry-run

# Set custom category
blog photos:import ~/vacation-photos --category Travel
```

**What it does:**
1. Scans directory for image files (JPG, PNG, HEIC)
2. Extracts EXIF metadata using ExifReader:
   - Camera make and model
   - Lens information
   - Camera settings (aperture, shutter speed, ISO, focal length)
   - Date and time photo was taken
3. Creates post folder: `content/posts/YYYY-MM-DD-slug/`
4. Copies original photo to folder
5. Generates `index.mdx` with frontmatter populated from EXIF

**Date handling:**
- Folder date = Today (upload/post date)
- `dateTaken` field = EXIF capture date (preserved in metadata)

This separation lets you post old photos while preserving when they were actually taken.

### AI-Powered Photo Tagging

Use Claude Vision API to analyze photos and suggest relevant tags:

```bash
# Set your Anthropic API key
export ANTHROPIC_API_KEY=your-key-here

# Tag a specific photo
blog photos:tag 2026-02-16-sunset-park

# Tag all photos interactively
blog photos:tag --all

# Auto-approve all suggestions
blog photos:tag --all --auto-approve

# Preview suggestions without updating
blog photos:tag --all --dry-run
```

**AI analysis includes:**
- Subject matter (people, objects, nature, architecture)
- Location type (urban, beach, indoor, outdoor)
- Mood and atmosphere (serene, dramatic, vibrant)
- Visual style (minimalist, colorful, vintage)
- Notable features (sunset, reflection, bokeh)

**Example AI-generated tags:**
- `seascape, ocean, sunset, coastal, water-reflection`
- `skateboarding, urban, dramatic-sky, action-sports`
- `bridge, autumn, reflection, park, colorful-foliage`

Tags are merged with existing ones (no duplicates) and appear on photo cards and filter pages.

### Photo Content Structure

Photos are stored alongside blog posts with `type: photo`:

```
content/posts/
├── 2026-02-16-sunset-park/
│   ├── index.mdx        # Photo post with EXIF metadata
│   └── photo.jpg        # Original photo
├── 2026-02-15-beach-walk/
│   ├── index.mdx
│   └── photo.jpg
└── ...
```

### Photo Frontmatter

Photo posts include all standard fields plus EXIF metadata:

```yaml
---
type: photo                    # Content type (required)
title: "Sunset in Brooklyn"
publishedAt: "2026-02-16"     # Post date (today)
excerpt: "Golden hour over the park"
category: "Photography"
tags: ["sunset", "urban", "golden-hour", "cityscape"]
coverImage: "./photo.jpg"

# EXIF metadata (automatically extracted)
camera: "Canon EOS R5"
lens: "RF 24-105mm f/4L IS USM"
aperture: "f/2.8"
shutterSpeed: "1/500"
iso: "400"
focalLength: "50mm"
dateTaken: "2024-08-15T18:30:00"  # Actual capture date
location: "Brooklyn, NY"

draft: false
---

Optional narrative or description of the photo...
```

### Photo Display Features

**Photo Cards (Homepage/Grid):**
- 4:3 aspect ratio (classic photo format)
- Photo badge overlay
- EXIF summary on hover
- Up to 4 tags displayed
- Camera info shown

**Individual Photo Pages:**
- Large responsive image display
- Organized EXIF panel with sections:
  - Equipment (camera, lens)
  - Settings (aperture, shutter, ISO, focal length)
  - Details (capture date, location)
- Full description/narrative
- Same SEO and sharing features as blog posts

**Photo-Only Feed:**
- Access at `/photos`
- Filters to show only photo posts
- Photo-optimized grid layout
- Pagination support

### Photo Workflow Example

Complete workflow from import to publish:

```bash
# 1. Import photos with EXIF extraction
blog photos:import ~/Desktop/vacation-photos

# 2. AI-tag the photos
export ANTHROPIC_API_KEY=your-key
blog photos:tag --all

# 3. Review and edit generated posts
# Edit content/posts/2026-02-16-*/index.mdx

# 4. Optimize images
blog images:optimize

# 5. Upload to S3
blog images:sync --profile www

# 6. Commit and deploy
git add content/posts/
git commit -m "Add vacation photos"
git push
```

### AI Tagging Requirements

To use AI photo tagging, you need:

1. **Anthropic API Key**: Get from https://console.anthropic.com/
2. **Set environment variable**:
   ```bash
   export ANTHROPIC_API_KEY=your-key-here
   ```
3. **Model**: Uses Claude Sonnet 4.5 for vision analysis
4. **Cost**: ~$0.01-0.02 per photo analyzed

**Recommended setup** (add to `~/.zshrc` or `~/.bashrc`):
```bash
export ANTHROPIC_API_KEY=your-key-here
```

## Image Workflow

This project uses a dual-storage system for images to support multi-machine workflows without bloating the Git repository.

### Storage Architecture

**Local:**
- Originals: `content/posts/{slug}/*.{jpg,png}`
- Processed: `.optimized-images/posts/{slug}/*-{size}.{webp,jpg}`

**S3:**
- Originals: `s3://bucket/images/originals/posts/{slug}/`
- Processed: `s3://bucket/images/posts/{slug}/`

### Image Processing

Each image is optimized into 6 files:
- `image-400.webp` (small, modern format)
- `image-400.jpg` (small, fallback)
- `image-800.webp` (medium, modern)
- `image-800.jpg` (medium, fallback)
- `image-1200.webp` (large, modern)
- `image-1200.jpg` (large, fallback)

**File Size Comparison:**

| Size | Format | Typical Size | Savings |
|------|--------|--------------|---------|
| Original | JPEG | 800 KB | - |
| 1200px | WebP | 160 KB | 80% |
| 800px | WebP | 80 KB | 90% |
| 400px | WebP | 20 KB | 97% |

Mobile users downloading 400px WebP save **97%** bandwidth!

### Daily Workflow

#### Adding Images to a Post

```bash
# 1. Add image to post directory
cp ~/photo.jpg content/posts/2024-01-15-my-post/cover.jpg

# 2. Reference in frontmatter
# coverImage: "./cover.jpg"

# 3. Optimize and upload everything
blog images:sync --profile www

# 4. Commit (only MDX, images are gitignored)
git add content/posts/2024-01-15-my-post/index.mdx
git commit -m "Add new blog post"
git push
```

#### Setting Up on a New Machine

```bash
# Clone repository
git clone <repo-url>
cd micahwalter-www

# Install dependencies
npm install

# Link CLI globally
npm link

# Download all images from S3
blog images:download --profile www

# Now you have originals + processed images!
```

### Image Recommendations

**Cover Images:**
- Dimensions: 1200px wide (or tall for portraits)
- Format: JPEG or PNG (will be converted)
- Quality: High quality (optimization is automatic)
- Max file size: 2MB before optimization
- Aspect ratio: 16:9 or 4:3 recommended

**File naming:**
- Use descriptive names: `cover.jpg`, `diagram.png`, `screenshot.jpg`
- Avoid generic: `img1.jpg`, `photo.png`

### How Images Are Served

Browser receives responsive `<picture>` elements:

```html
<picture>
  <source
    srcset="
      https://cdn.example.com/images/posts/slug/cover-400.webp 400w,
      https://cdn.example.com/images/posts/slug/cover-800.webp 800w,
      https://cdn.example.com/images/posts/slug/cover-1200.webp 1200w
    "
    type="image/webp"
  />
  <source
    srcset="
      https://cdn.example.com/images/posts/slug/cover-400.jpg 400w,
      https://cdn.example.com/images/posts/slug/cover-800.jpg 800w,
      https://cdn.example.com/images/posts/slug/cover-1200.jpg 1200w
    "
    type="image/jpeg"
  />
  <img src="https://cdn.example.com/images/posts/slug/cover-800.jpg" alt="..." loading="lazy" />
</picture>
```

**Browser intelligently chooses:**
- Format: WebP if supported (97%+ browsers), otherwise JPEG
- Size: Based on viewport width (mobile: 400px, tablet: 800px, desktop: 1200px)

## Development

### NPM Scripts

```bash
npm run dev              # Start dev server with Turbopack
npm run build            # Production build (runs prebuild automatically)
npm run start            # Start production server
npm run lint             # ESLint check

# Image scripts (prefer blog CLI)
npm run optimize-images  # Legacy: use blog images:optimize
npm run upload-images:www # Legacy: use blog images:upload --profile www
npm run images:dev       # Optimize + copy to public/ for dev
```

### Environment Variables

**Production (GitHub Actions secrets):**

| Secret | Description |
|--------|-------------|
| `AWS_ROLE_ARN` | IAM role ARN for OIDC deployment |
| `NEXT_PUBLIC_FATHOM_SITE_ID` | Fathom Analytics site ID (baked in at build time) |

**Local Development:**
Create `.env.local`:

```bash
NEXT_PUBLIC_FATHOM_SITE_ID=your-fathom-site-id
```

## Build Process

The build runs in this order:

### 1. Prebuild Scripts (Automatic)

Triggered by `prebuild` in package.json before `next build`:

- `generate-posts-json.js` → `/public/posts.json` (search index)
- `generate-rss.js` → `/public/feed.xml`
- `generate-sitemap.js` → `/public/sitemap.xml`

### 2. Next.js Build

- Generates static HTML for all routes
- Uses `generateStaticParams()` for dynamic routes
- Outputs to `/out` directory
- No API routes (static export mode)

### 3. Deployment (GitHub Actions)

- Syncs `/out` to S3 with optimized cache headers
- Invalidates CloudFront cache
- Takes ~3-4 minutes total

## Deployment

### Automated Deployment (Recommended)

Push to `main` branch triggers automatic deployment:

```bash
# Make changes
git add .
git commit -m "Update website"
git push

# GitHub Actions will:
# 1. Install dependencies
# 2. Build Next.js static export
# 3. Sync to S3 with cache headers
# 4. Invalidate CloudFront cache
# 5. Deploy globally in ~3-4 minutes
```

### Manual Deployment Trigger

```bash
# Via GitHub CLI
gh workflow run deploy.yml

# Or via GitHub web interface
# https://github.com/micahwalter/micahwalter-www/actions/workflows/deploy.yml
```

### Monitor Deployments

```bash
# View recent deployments
gh run list --workflow=deploy.yml

# Watch current deployment
gh run watch

# View detailed logs
gh run view --log
```

## Infrastructure

### AWS Resources

**Main Stack (CloudFormation — `infra/infra.yml`):**
- S3 Website Bucket (static HTML/JS/CSS)
- S3 Images Bucket (optimized images)
- S3 Logs Bucket (access logs)
- ACM Certificate (`www.micahwalter.com` + `micahwalter.com`, DNS validated)
- CloudFront Distribution (CDN for `www.micahwalter.com`)
- CloudFront Apex Redirect Distribution (`micahwalter.com` → 301 → `www.micahwalter.com`)
- CloudFront Functions (SPA routing + apex redirect)
- Route53 A/AAAA alias records for both domains
- Origin Access Control (secure S3 access)

**GitHub Actions Stack (`infra/github-actions-role.yml`):**
- IAM Role with OIDC provider
- Least-privilege permissions for S3 and CloudFront

### Initial Infrastructure Setup

```bash
# Deploy main infrastructure (requires HostedZoneId from Route53)
aws cloudformation create-stack \
  --stack-name micahwalter-www \
  --template-body file://infra/infra.yml \
  --parameters \
    ParameterKey=HostedZoneId,ParameterValue=<your-hosted-zone-id> \
    ParameterKey=DomainName,ParameterValue=micahwalter.com \
    ParameterKey=WWWDomainName,ParameterValue=www.micahwalter.com \
  --profile www \
  --region us-east-1

# Deploy GitHub Actions OIDC role
aws cloudformation create-stack \
  --stack-name micahwalter-www-github-actions \
  --template-body file://infra/github-actions-role.yml \
  --capabilities CAPABILITY_NAMED_IAM \
  --profile www \
  --region us-east-1

# Wait for completion (5-15 minutes)
aws cloudformation wait stack-create-complete \
  --stack-name micahwalter-www \
  --profile www \
  --region us-east-1

# Get IAM role ARN for GitHub Actions
aws cloudformation describe-stacks \
  --stack-name micahwalter-www-github-actions \
  --profile www \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`RoleArn`].OutputValue' \
  --output text

# Add role ARN as GitHub secret
gh secret set AWS_ROLE_ARN --body "<role-arn>"
```

### Get Deployment Info

```bash
# Get all stack outputs
aws cloudformation describe-stacks \
  --stack-name micahwalter-www \
  --profile www \
  --region us-east-1 \
  --query 'Stacks[0].Outputs' \
  --output table

# Shows:
# - CloudFront URL
# - Distribution ID
# - Website Bucket Name
# - Images Bucket Name
# - Logs Bucket Name
```

### Update Infrastructure

```bash
# Update main stack
aws cloudformation update-stack \
  --stack-name micahwalter-www \
  --template-body file://infra/infra.yml \
  --parameters \
    ParameterKey=HostedZoneId,ParameterValue=<your-hosted-zone-id> \
    ParameterKey=DomainName,ParameterValue=micahwalter.com \
    ParameterKey=WWWDomainName,ParameterValue=www.micahwalter.com \
  --profile www \
  --region us-east-1

# Update GitHub Actions role
aws cloudformation update-stack \
  --stack-name micahwalter-www-github-actions \
  --template-body file://infra/github-actions-role.yml \
  --capabilities CAPABILITY_NAMED_IAM \
  --profile www \
  --region us-east-1
```

### Manual Deployment (Advanced)

If you need to deploy without GitHub Actions:

```bash
STACK_NAME=micahwalter-www

# Get bucket and distribution ID
S3_BUCKET=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query 'Stacks[0].Outputs[?OutputKey==`WebsiteBucketName`].OutputValue' \
  --output text \
  --profile www)

DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
  --output text \
  --profile www)

# Upload files
aws s3 sync out/ s3://$S3_BUCKET/ \
  --delete \
  --profile www

# Invalidate cache
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*" \
  --profile www
```

## Design System

Defined in `tailwind.config.ts`:

**Colors:**
- Cream: `#fafaf2` (background)
- Charcoal: `#191919` (text)
- Gray: `#5F5F5F` (metadata)
- Accent: `#F5B684` (links, highlights)

**Typography:**
- EB Garamond: Serif for body text and headings
- System fonts: Sans-serif for UI elements

**Layout:**
- Max width (reading): 645px
- Max width (wide): 1340px
- Mobile-first responsive breakpoints

## Features

### Blog Features
- ✅ MDX-based content management
- ✅ Blog post grid with featured layout
- ✅ Category filtering (AI, AWS, Writing, Photography)
- ✅ Tag system for content organization
- ✅ Client-side search functionality
- ✅ RSS feed generation
- ✅ Dynamic sitemap
- ✅ SEO-optimized metadata
- ✅ Syntax-highlighted code blocks
- ✅ Responsive images with lazy loading
- ✅ Mobile-friendly navigation
- ✅ Draft post support (dev vs production)
- ✅ Themed 404 page (`app/not-found.tsx`)
- ✅ Fathom Analytics (privacy-first, page-view tracking)

### Photo Archive Features
- ✅ Unified content system (photos as posts with `type: photo`)
- ✅ Bulk photo import with EXIF extraction
- ✅ AI-powered tagging with Claude Vision API
- ✅ EXIF metadata display (camera, lens, settings, capture date)
- ✅ Photo-optimized layouts (4:3 aspect ratio cards)
- ✅ Photo-only filtering route (`/photos`)
- ✅ Interactive tagging approval workflow
- ✅ Tag merging (preserves existing tags)
- ✅ Separation of post date vs capture date
- ✅ Same image optimization as blog posts

### Infrastructure Features
- ✅ HTTPS enabled (TLS 1.2+)
- ✅ HTTP/2 and HTTP/3 support
- ✅ Custom domain (`www.micahwalter.com`) with ACM SSL certificate
- ✅ Apex redirect (`micahwalter.com` → 301 → `https://www.micahwalter.com`)
- ✅ Global edge locations
- ✅ SPA routing (CloudFront Function)
- ✅ Gzip/Brotli compression
- ✅ S3 versioning (365-day retention)
- ✅ AES256 encryption at rest
- ✅ Access logging for S3 and CloudFront
- ✅ Origin Access Control (OAC)
- ✅ Smart caching (1 year static, revalidate HTML)

### CI/CD Features
- ✅ Automated build and deployment
- ✅ OIDC authentication (no stored credentials)
- ✅ Automatic CloudFront invalidation
- ✅ Manual deployment trigger option
- ✅ Build-time image optimization
- ✅ Separate image and content buckets
- ✅ Path triggers cover `app/`, `components/`, `lib/`, `content/`, `public/`, `scripts/`

## Security

- Origin Access Control (OAC) for secure S3 access
- Public access blocked on all buckets
- CloudFront serves all content over HTTPS
- HTTP to HTTPS redirect enforced
- GitHub Actions uses OIDC (no stored AWS credentials)
- IAM roles with least-privilege permissions
- S3 versioning for content recovery
- AES256 encryption at rest

## Cost Optimization

**Storage:**
- Standard S3 (no replication)
- Log lifecycle: 90-day retention
- Version lifecycle: 365-day retention
- AES256 encryption (no KMS costs)

**Estimated Monthly Costs:**

For a blog with 100 posts, 1 cover image each, 10K pageviews/month:

| Service | Usage | Cost |
|---------|-------|------|
| S3 Storage | 60 MB images + 10 MB site | $0.002 |
| S3 Requests | Minimal (CI uploads only) | $0.001 |
| CloudFront | 1 GB transfer (optimized images) | $0.085 |
| **Total** | | **~$0.09/month** |

Without optimization: ~$0.70/month (87% savings)

## Troubleshooting

### Images not loading after deploy

1. **Check S3**: Verify images uploaded
   ```bash
   aws s3 ls s3://micahwalter-www-images/images/posts/{slug}/ --profile www
   ```

2. **Check CloudFront**: May take a few minutes. Try invalidating:
   ```bash
   aws cloudfront create-invalidation \
     --distribution-id <DISTRIBUTION_ID> \
     --paths "/images/*" \
     --profile www
   ```

3. **Check browser console**: Look for 404 errors

### Build fails during image optimization

1. **Rebuild sharp** (platform-specific binaries):
   ```bash
   npm rebuild sharp
   ```

2. **Check image format**: Ensure JPEG, PNG, or WebP

3. **Check file size**: Very large images (>10MB) may cause issues

### Images not uploading to S3

```bash
# Check AWS credentials
aws s3 ls --profile www

# Try dry-run first
blog images:upload --dry-run --profile www

# Check bucket name in environment
echo $IMAGES_BUCKET
```

### Need to re-optimize all images

```bash
rm -rf .optimized-images
blog images:optimize
```

### GitHub Actions deployment failing

1. **Check Actions logs**: View detailed error messages
2. **Verify IAM permissions**: Ensure role has S3 and CloudFront access
3. **Check secrets**: Verify `AWS_ROLE_ARN` is set correctly
4. **Review CloudFormation**: Ensure stacks are in good state

### CloudFront returns 403 errors

1. **Check bucket policy**: Verify OAC has access
2. **Check origin configuration**: Ensure CloudFront is using OAC
3. **Wait**: OAC changes take 5-10 minutes to propagate

## Performance Metrics

### Expected Improvements

**Before optimization:**
- Cover image: ~800 KB
- Mobile load time: 1-2s on 3G
- Lighthouse Performance: 70-80

**After optimization:**
- Cover image: 20-160 KB (depending on device)
- Mobile load time: 0.3-0.6s on 3G
- Lighthouse Performance: 90-100

### WebP Browser Support

WebP is supported by 97%+ of browsers:
- ✅ Chrome 32+
- ✅ Firefox 65+
- ✅ Safari 14+
- ✅ Edge 18+
- ❌ IE 11 (falls back to JPEG)

## Static Export Limitations

`output: "export"` is enabled in **production only** (`NODE_ENV === "production"`). Dev mode uses standard Next.js routing. In production builds:

- **No API routes**: Cannot use `/app/api/*` routes
- **No server-side rendering**: Everything is pre-rendered at build time
- **No server actions**: No runtime server code
- **Dynamic routes**: Must use `generateStaticParams()`
- **Generated files**: Must be created at build time via prebuild scripts

## Important Patterns

### Next.js 15 Async Params

Dynamic route params are Promises and must be awaited:

```typescript
export default async function Page({ params }: Props) {
  const { slug } = await params; // Must await!
  // ...
}
```

### Content Filtering

- `getAllPosts()` - Returns all posts (blog + photos), filtering drafts in production
- `getSortedPosts()` - Posts sorted by publishedAt (newest first)
- `getBlogPosts()` - Filter to only blog posts (`type: 'blog'`)
- `getPhotos()` - Filter to only photo posts (`type: 'photo'`)
- `getPostsByCategory(category)` - Filter by category
- `getPostsByTag(tag)` - Filter by tag

### Code Syntax Highlighting

Uses `rehype-highlight` with custom theme:
- Import `highlight.js/styles/atom-one-dark.min.css` first in `globals.css`
- Custom CSS overrides ensure readable contrast
- All code blocks use cream text on charcoal background

## License

Private

---

**For detailed developer guidance, see [CLAUDE.md](./CLAUDE.md)**
