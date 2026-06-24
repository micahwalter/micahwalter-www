# Technology Stack

## Programming Languages

| Language | Version | Usage |
|----------|---------|-------|
| TypeScript | ^5 | App Router pages, components, lib modules, config |
| JavaScript | ES modules / CommonJS | CLI, build scripts, prebuild generators |
| Go | 1.x (module in newsletter-lambdas) | Newsletter Lambda functions (linux/arm64) |
| MDX | — | Content authoring format for posts, galleries, sketches |

## Frameworks

| Framework | Version | Purpose |
|-----------|---------|---------|
| Next.js | ^15.1.6 | App Router, static export, RSC |
| React | ^19.0.0 | UI components |
| Tailwind CSS | ^3.4.1 | Utility-first styling |
| next-mdx-remote | ^6.0.0 | Server-side MDX rendering |
| Headless UI | ^2.2.9 | Accessible dialogs (search, mobile menu) |
| Mermaid | ^11.13.0 | Architecture diagrams (colophon) |

## Content Processing

| Tool | Version | Purpose |
|------|---------|---------|
| gray-matter | ^4.0.3 | YAML frontmatter parsing |
| unified | ^11.0.5 | Markdown/MDX processing pipeline |
| remark-gfm | ^4.0.1 | GitHub Flavored Markdown |
| remark-parse / remark-rehype | ^11.x | Markdown AST pipeline |
| rehype-highlight | ^7.0.2 | Syntax highlighting (atom-one-dark theme) |
| rehype-stringify | ^10.0.1 | HTML output |
| turndown + turndown-plugin-gfm | ^7.2.2 | HTML to plain text (newsletter email) |

## Infrastructure (AWS)

| Service | Purpose |
|---------|---------|
| Amazon S3 | Static site hosting, image storage (originals + processed) |
| Amazon CloudFront | CDN for website and images; origin groups for failover |
| AWS Route53 | DNS, health-check failover routing |
| AWS Certificate Manager | TLS certificates for www and api domains |
| Amazon API Gateway (HTTP API) | Newsletter REST endpoints |
| AWS Lambda (Go, arm64) | Newsletter subscribe, confirm, dispatch, etc. |
| Amazon DynamoDB | Subscriber and send tracking tables |
| Amazon EventBridge | Newsletter event bus (campaigns, signups) |
| Amazon SQS | Dispatch queue for bulk email processing |
| Amazon SES | Transactional and bulk templated email |
| AWS Secrets Manager | HMAC signing keys |
| Amazon CloudWatch | Alarms for newsletter system |
| AWS CloudFormation | Infrastructure as code (9 templates) |

## Build Tools

| Tool | Version | Purpose |
|------|---------|---------|
| npm | — | Package management and script runner |
| Turbopack | (via next dev) | Dev server bundler |
| PostCSS | ^8 | CSS processing |
| sharp | ^0.34.5 | Image optimization (400/800/1200px WebP+JPEG) |
| exifreader | ^4.36.1 | Photo EXIF metadata extraction |
| Make | — | Newsletter Lambda build/upload (`infra/newsletter-lambdas/Makefile`) |

## Testing Tools

| Tool | Status |
|------|--------|
| ESLint (eslint-config-next) | Configured — `npm run lint` |
| Jest / Vitest / Playwright | Not configured |
| Go test | Not present in newsletter-lambdas |

## CI/CD

| Tool | Purpose |
|------|---------|
| GitHub Actions | Site deploy, infra deploy, newsletter Lambda deploy |
| GitHub OIDC | AWS authentication without long-lived credentials |
| AWS CLI | S3 sync, CloudFront invalidation, Lambda updates |

## External Services

| Service | Purpose |
|---------|---------|
| Fathom Analytics | Privacy-friendly pageview tracking |
| Mastodon (micah.social) | Microblog archive source |
| AWS Bedrock (Claude Vision) | AI photo tagging (authoring script only) |

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| cream | #fafaf2 | Background |
| charcoal | #191919 | Text, code blocks |
| gray | #5F5F5F | Secondary text |
| accent | #F5B684 | Highlights |
| reading width | 645px | Prose content |
| wide width | 1340px | Full layouts |
| Font | EB Garamond (Google Fonts) | Body and headings |

## Environment Variables

| Variable | Scope | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_FATHOM_SITE_ID` | Build-time (client) | Fathom analytics site ID |
| `NEXT_PUBLIC_NEWSLETTER_API_URL` | Build-time (client) | Newsletter API base URL |
| `NEXT_PUBLIC_CDN_URL` | Build-time (client) | Optional CDN prefix for images |
| `NODE_ENV` | Build/runtime | Controls static export and draft filtering |
| Lambda env vars | Runtime (Go) | DynamoDB table names, EventBridge bus, Secrets ARN, SITE_URL |
