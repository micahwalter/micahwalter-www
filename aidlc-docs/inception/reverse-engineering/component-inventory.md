# Component Inventory

## Application Packages

| Package | Path | Purpose |
|---------|------|---------|
| **Static Site** | `app/`, `components/`, `lib/` | Next.js 15 App Router static blog and media site |
| **Blog CLI** | `cli/index.js`, `scripts/` | Unified command-line tool for content, images, and email operations |
| **Content Store** | `content/posts/`, `content/galleries/`, `content/sketches/` | MDX-based file CMS (143 posts, 2 galleries, 10 sketches) |
| **Public Assets** | `public/` | Static files, build-generated indexes, sketch HTML files |

## Infrastructure Packages

| Package | Path | Type | Purpose |
|---------|------|------|---------|
| **Website Stack** | `infra/infra.yml` | CloudFormation | S3, CloudFront, Route53, ACM for www.micahwalter.com |
| **Website Failover** | `infra/infra-secondary.yml` | CloudFormation | Secondary region S3 buckets (us-east-2) |
| **API Domain** | `infra/api-domain.yml` | CloudFormation | Shared api.micahwalter.com custom domain |
| **API Domain Secondary** | `infra/api-domain-secondary.yml` | CloudFormation | Secondary API domain with failover routing |
| **Newsletter Stack** | `infra/newsletter.yml` | CloudFormation | DynamoDB, EventBridge, SQS, API Gateway, SES, Lambdas |
| **Newsletter Secondary** | `infra/newsletter-secondary.yml` | CloudFormation | Secondary newsletter API (no dispatch Lambda) |
| **Newsletter Bootstrap** | `infra/newsletter-bootstrap.yml` | CloudFormation | Lambda artifacts S3 bucket |
| **Newsletter Bootstrap Secondary** | `infra/newsletter-bootstrap-secondary.yml` | CloudFormation | Secondary artifacts bucket |
| **GitHub Actions Role** | `infra/github-actions-role.yml` | CloudFormation | OIDC IAM role for CI/CD |

## Serverless Application Packages

| Package | Path | Runtime | Purpose |
|---------|------|---------|---------|
| **subscribe** | `infra/newsletter-lambdas/cmd/subscribe/` | Go (arm64) | Newsletter signup with bot protection |
| **confirm** | `infra/newsletter-lambdas/cmd/confirm/` | Go (arm64) | Double opt-in confirmation |
| **unsubscribe** | `infra/newsletter-lambdas/cmd/unsubscribe/` | Go (arm64) | Token-based unsubscribe |
| **email** | `infra/newsletter-lambdas/cmd/email/` | Go (arm64) | Transactional SES emails |
| **dispatch** | `infra/newsletter-lambdas/cmd/dispatch/` | Go (arm64) | Bulk campaign send via SQS |
| **formtoken** | `infra/newsletter-lambdas/cmd/formtoken/` | Go (arm64) | CSRF form token issuance |
| **health** | `infra/newsletter-lambdas/cmd/health/` | Go (arm64) | Route53 health check endpoint |

## Shared Packages

| Package | Path | Type | Purpose |
|---------|------|------|---------|
| **dynamo** | `infra/newsletter-lambdas/internal/dynamo/` | Go library | DynamoDB client, subscriber queries, send records |
| **events** | `infra/newsletter-lambdas/internal/events/` | Go library | EventBridge event type definitions |
| **token** | `infra/newsletter-lambdas/internal/token/` | Go library | HMAC-signed confirmation/unsubscribe tokens |
| **secrets** | `infra/newsletter-lambdas/internal/secrets/` | Go library | Secrets Manager HMAC key loading |
| **formtoken** | `infra/newsletter-lambdas/internal/formtoken/` | Go library | Short-lived form token generation/validation |
| **script lib** | `scripts/lib/` | Node.js utilities | WordPress API, post writer, HTML-to-MDX, image downloader |
| **content lib** | `lib/content.ts` | TypeScript module | Shared post parsing and querying |
| **galleries lib** | `lib/galleries.ts` | TypeScript module | Gallery resolution |
| **sketches lib** | `lib/sketches.ts` | TypeScript module | Sketch content handling |
| **mastodon lib** | `lib/mastodon.ts` | TypeScript module | Mastodon archive types and helpers |

## CI/CD Packages

| Package | Path | Purpose |
|---------|------|---------|
| **Site Deploy** | `.github/workflows/deploy.yml` | Build static site, sync S3, invalidate CloudFront |
| **Infra Deploy** | `.github/workflows/infra-deploy.yml` | Deploy website CloudFormation stacks |
| **Newsletter Deploy** | `.github/workflows/newsletter-deploy.yml` | Build/upload Go Lambdas, update functions or full stack |

## UI Component Inventory

| Component | Category | Used By |
|-----------|----------|---------|
| Header, MobileMenu, Footer | Layout | All pages via root layout |
| PostLayout, PhotoLayout | Content | Post detail pages |
| PostCard, PhotoCard, PostGrid, PaginatedPostGrid | Listing | Index and archive pages |
| ResponsiveImage, ZoomableImage | Media | Posts, galleries, MDX images |
| MDXComponents | Content rendering | All MDX pages |
| SearchBar | Search | Header (client-side) |
| SubscribeForm, ConfirmHandler, UnsubscribeForm | Newsletter | Newsletter pages |
| GalleryCard, GalleryViewer | Galleries | Gallery pages |
| ExifDisplay | Photo metadata | Photo posts |
| MermaidDiagram | Visualization | Colophon page |
| Fathom | Analytics | Root layout |
| Pagination, PaginatedTootList, TopicsDropdown | Navigation | Various listing pages |

## Total Count

| Category | Count |
|----------|-------|
| **Total Packages/Subsystems** | 12 |
| **Application** | 4 (site, CLI, content, public assets) |
| **Infrastructure (CloudFormation)** | 9 templates |
| **Serverless (Go Lambdas)** | 7 functions |
| **Shared Libraries** | 10 modules |
| **CI/CD Workflows** | 3 |
| **React Components** | 21 |
| **App Router Pages** | 27 |
| **Content Posts** | 143 folders |
