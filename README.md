# Micah Walter's Website

A modern blog built with Next.js and hosted on AWS using S3 and CloudFront with automated CI/CD.

## Tech Stack

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling with custom design system
- **MDX**: Markdown content with React components
- **EB Garamond & Beiruti**: Google Fonts for typography
- **S3 + CloudFront**: Serverless hosting with global CDN
- **GitHub Actions**: Automated build and deployment

## Architecture

- **S3 Bucket**: Static file storage with versioning enabled
- **CloudFront**: Global CDN with HTTPS
- **CloudFront Function**: SPA routing support
- **Access Logging**: Both S3 and CloudFront logs enabled
- **GitHub Actions**: Automated build and deployment pipeline with OIDC authentication

## Local Development

### Prerequisites

- Node.js 20+ installed
- npm or yarn

### Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000 in your browser
```

### Build for Production

```bash
# Create production build (includes generating posts.json, RSS feed, and sitemap)
npm run build

# Preview production build locally
npx serve out/
```

## Content Management

### Creating Blog Posts

Posts are written in MDX format and stored in the `content/posts/` directory. Each post has its own folder with the naming convention: `YYYY-MM-DD-slug-name/`.

#### Create a New Post

1. Create a new directory: `content/posts/2024-01-15-my-post-title/`
2. Create `index.mdx` file with frontmatter:

```mdx
---
title: "My Post Title"
publishedAt: "2024-01-15"
excerpt: "A brief description of the post that appears in listings and SEO."
category: "AI" # or "AWS", "Writing"
tags: ["tag1", "tag2", "tag3"]
coverImage: "./cover.jpg" # optional
draft: false
---

Your post content here in markdown/MDX format.

## Heading 2

Regular markdown features work:
- Lists
- **Bold** and *italic*
- [Links](https://example.com)
- Code blocks with syntax highlighting

\```javascript
const example = "code";
\```

You can also use JSX components if needed.
```

#### Frontmatter Fields

- **title** (required): Post title displayed in listings and detail page
- **publishedAt** (required): Publication date in YYYY-MM-DD format
- **excerpt** (required): Brief summary for listings and SEO
- **category** (required): One of "AI", "AWS", or "Writing"
- **tags** (optional): Array of tag strings
- **coverImage** (optional): Relative path to cover image in post folder
- **draft** (optional): Set to `true` to exclude from build

#### Adding Images

Place images in the same folder as your post:

```
content/posts/2024-01-15-my-post/
  index.mdx
  cover.jpg       # Cover image (1200x675 recommended)
  diagram.png     # Additional images
```

Reference images in your MDX:

```markdown
![Alt text](./diagram.png)
```

### Content Structure

```
content/
└── posts/
    ├── 2024-01-15-building-ai-agents/
    │   ├── index.mdx
    │   └── cover.jpg
    ├── 2024-02-03-serverless-architecture-aws/
    │   └── index.mdx
    └── ...
```

### Generated Files

The build process automatically generates:
- `/public/posts.json` - Search index for client-side search
- `/public/feed.xml` - RSS feed for all published posts
- `/public/sitemap.xml` - Sitemap for SEO

These are regenerated on every build.

## Deployment

### Automated Deployment (Recommended)

Simply push changes to the `main` branch and GitHub Actions will automatically build and deploy:

```bash
# Make changes to your Next.js app
# Edit files in app/ directory

# Commit and push
git add .
git commit -m "Update website"
git push
```

GitHub Actions will:
1. Install dependencies
2. Build Next.js static export
3. Sync files to S3 with optimized caching headers
4. Invalidate CloudFront cache
5. Deploy changes globally in ~3-4 minutes

### Manual Deployment Trigger

```bash
# Trigger deployment manually via GitHub CLI
gh workflow run deploy.yml

# Or via the GitHub web interface:
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

## Infrastructure Setup

### Prerequisites

- AWS CLI installed and configured
- AWS profile `www` set up with appropriate permissions
- GitHub CLI (optional, for workflow management)

### Initial Infrastructure Deployment

```bash
# Deploy main infrastructure (S3, CloudFront)
aws cloudformation create-stack \
  --stack-name micahwalter-www \
  --template-body file://infra/infra.yml \
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

# Get the IAM role ARN for GitHub Actions
aws cloudformation describe-stacks \
  --stack-name micahwalter-www-github-actions \
  --profile www \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`RoleArn`].OutputValue' \
  --output text

# Add the role ARN as a GitHub secret
gh secret set AWS_ROLE_ARN --body "<role-arn-from-above>"
```

## Get Your Deployment Info

After deploying the CloudFormation stack, get your deployment details:

```bash
# Get all stack outputs
aws cloudformation describe-stacks \
  --stack-name micahwalter-www \
  --profile www \
  --region us-east-1 \
  --query 'Stacks[0].Outputs' \
  --output table
```

This will show:
- **CloudFront URL**: Your website URL
- **Distribution ID**: For cache invalidation
- **Website Bucket**: S3 bucket name for content
- **Logs Bucket**: S3 bucket name for logs

## Features

### Blog Features
- ✅ MDX-based content management
- ✅ Blog post grid with featured posts
- ✅ Category filtering (AI, AWS, Writing)
- ✅ Tag system for organizing content
- ✅ Client-side search functionality
- ✅ RSS feed generation
- ✅ Dynamic sitemap
- ✅ SEO-optimized metadata
- ✅ Syntax-highlighted code blocks
- ✅ Responsive images with lazy loading
- ✅ Mobile-friendly navigation

### Frontend
- ✅ Next.js 15 with App Router
- ✅ TypeScript for type safety
- ✅ Tailwind CSS with custom design system
- ✅ Editorial typography (EB Garamond serif)
- ✅ Warm neutral color palette
- ✅ Static export (no server required)
- ✅ Optimized production builds
- ✅ Fast development with Turbopack

### Infrastructure
- ✅ HTTPS enabled (TLS 1.2+)
- ✅ HTTP/2 and HTTP/3 support
- ✅ Global edge locations (PriceClass_All)
- ✅ SPA routing (paths without extensions route to index.html)
- ✅ Gzip/Brotli compression
- ✅ S3 versioning (365-day retention)
- ✅ AES256 encryption at rest
- ✅ Access logging for S3 and CloudFront
- ✅ Optimized caching policy

### CI/CD
- ✅ Automated build and deployment on push to `main`
- ✅ GitHub Actions workflow with OIDC authentication
- ✅ Smart caching: static assets cached for 1 year, HTML revalidated
- ✅ Automatic CloudFront cache invalidation
- ✅ Manual deployment trigger option
- ✅ No long-lived AWS credentials stored

## Security

- Origin Access Control (OAC) for secure S3 access
- Public access blocked on all buckets
- CloudFront serves all content over HTTPS
- Viewer protocol policy redirects HTTP to HTTPS
- GitHub Actions uses OIDC (no stored credentials)
- IAM role with least-privilege permissions

## Cost Optimization

- Standard S3 replication removed (simplified architecture)
- Log lifecycle policy (90-day retention)
- Version lifecycle policy (365-day retention)
- AES256 encryption (no KMS costs)

## Management Commands

### Update Infrastructure

```bash
# Update main infrastructure stack
aws cloudformation update-stack \
  --stack-name micahwalter-www \
  --template-body file://infra/infra.yml \
  --profile www \
  --region us-east-1

# Update GitHub Actions role stack
aws cloudformation update-stack \
  --stack-name micahwalter-www-github-actions \
  --template-body file://infra/github-actions-role.yml \
  --capabilities CAPABILITY_NAMED_IAM \
  --profile www \
  --region us-east-1
```

### Manual Deployment (Advanced)

If you need to deploy directly without GitHub Actions:

```bash
# Set your stack name
STACK_NAME=micahwalter-www

# Get bucket and distribution ID from CloudFormation outputs
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

# Upload files to S3
aws s3 sync out/ s3://$S3_BUCKET/ \
  --delete \
  --profile www

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*" \
  --profile www
```

### View Logs

```bash
# Set your stack name
STACK_NAME=micahwalter-www

# Get logs bucket from CloudFormation output
LOGS_BUCKET=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query 'Stacks[0].Outputs[?OutputKey==`LogsBucketName`].OutputValue' \
  --output text \
  --profile www)

# List CloudFront logs
aws s3 ls s3://$LOGS_BUCKET/cloudfront-logs/ \
  --profile www \
  --recursive

# List S3 access logs
aws s3 ls s3://$LOGS_BUCKET/s3-access-logs/ \
  --profile www \
  --recursive

# Download recent CloudFront logs
aws s3 sync s3://$LOGS_BUCKET/cloudfront-logs/ ./logs/cloudfront/ \
  --profile www
```

### Delete Stack (Cleanup)

```bash
# Set your stack name
STACK_NAME=micahwalter-www

# Get bucket names from CloudFormation outputs
WEBSITE_BUCKET=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query 'Stacks[0].Outputs[?OutputKey==`WebsiteBucketName`].OutputValue' \
  --output text \
  --profile www)

LOGS_BUCKET=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query 'Stacks[0].Outputs[?OutputKey==`LogsBucketName`].OutputValue' \
  --output text \
  --profile www)

# Empty buckets first (required before deleting CloudFormation stack)
aws s3 rm s3://$WEBSITE_BUCKET --recursive --profile www
aws s3 rm s3://$LOGS_BUCKET --recursive --profile www

# Delete stacks
aws cloudformation delete-stack \
  --stack-name $STACK_NAME \
  --profile www \
  --region us-east-1

aws cloudformation delete-stack \
  --stack-name ${STACK_NAME}-github-actions \
  --profile www \
  --region us-east-1
```

## License

Private
