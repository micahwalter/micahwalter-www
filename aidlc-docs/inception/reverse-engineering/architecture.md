# System Architecture

## System Overview

micahwalter-www is a **static-first personal publishing platform** composed of three major subsystems:

1. **Static Site** — Next.js 15 App Router application exported to HTML at build time, served from S3 via CloudFront
2. **Image CDN** — Dual-storage pipeline (originals + processed variants) on S3, served through CloudFront
3. **Newsletter API** — Event-driven Go Lambda functions behind API Gateway, using DynamoDB, EventBridge, SQS, and SES

There is no server-side runtime for the public site in production. All dynamic behavior (search, newsletter forms) is either client-side or calls external APIs.

## Architecture Diagram

```mermaid
flowchart TB
    subgraph Authoring["Authoring (Local)"]
        MDX[content/posts MDX]
        CLI[blog CLI]
        IMG[Post Images]
    end

    subgraph Build["Build Pipeline"]
        PRE[prebuild scripts]
        NEXT[Next.js build]
        OUT[/out static HTML/]
    end

    subgraph Hosting["AWS Static Hosting us-east-1 primary"]
        S3W[S3 Website Bucket]
        S3I[S3 Images Bucket]
        CF[CloudFront www.micahwalter.com]
        R53[Route53 DNS]
    end

    subgraph Failover["AWS Failover us-east-2"]
        S3W2[S3 Website Secondary]
        S3I2[S3 Images Secondary]
    end

    subgraph Newsletter["Newsletter API api.micahwalter.com"]
        APIGW[API Gateway HTTP API]
        LSUB[subscribe confirm unsubscribe formtoken email health]
        LDSP[dispatch Lambda]
        EB[EventBridge newsletter-bus]
        SQS[SQS dispatch queue]
        DDB[(DynamoDB subscribers sends)]
        SES[Amazon SES]
        SM[Secrets Manager HMAC key]
    end

    subgraph CI["GitHub Actions"]
        DEPLOY[deploy.yml]
        INFRA[infra-deploy.yml]
        NL[newsletter-deploy.yml]
    end

    MDX --> PRE
    MDX --> NEXT
    PRE --> PUB[public posts.json feed.xml sitemap.xml mastodon.json]
    NEXT --> OUT
    CLI --> IMG
    CLI --> OPT[.optimized-images]
    OPT --> S3I
    IMG --> S3I

    OUT --> S3W
    S3W --> CF
    S3I --> CF
    R53 --> CF
    S3W -.CRR.-> S3W2
    S3I -.CRR.-> S3I2

    DEPLOY --> Build
    DEPLOY --> S3W
    DEPLOY --> CF
    INFRA --> Hosting
    NL --> Newsletter

    SubscribeUI[SubscribeForm.tsx] --> APIGW
    APIGW --> LSUB
    LSUB --> DDB
    LSUB --> EB
    LSUB --> SM
    CLI -->|email:send| EB
    EB --> SQS --> LDSP
    LDSP --> DDB
    LDSP --> SES
```

## Component Descriptions

### Next.js Static Site (`app/`, `components/`, `lib/`)
- **Purpose**: Render all public pages from MDX content and build-time data
- **Responsibilities**: Blog/photo/email pages, galleries, sketches, Mastodon archive, newsletter UI, search, pagination, legacy URL redirects
- **Dependencies**: `lib/content.ts`, `lib/galleries.ts`, `lib/sketches.ts`, `lib/mastodon.ts`, prebuild-generated `public/` files
- **Type**: Application

### Blog CLI (`cli/index.js`, `scripts/`)
- **Purpose**: Unified command-line interface for content and image operations
- **Responsibilities**: Post creation, photo import/tagging, image optimize/upload/download/sync, static file generation, newsletter send trigger
- **Dependencies**: Node.js, AWS CLI (for S3), EventBridge (for email send)
- **Type**: Application (developer tooling)

### Newsletter Lambdas (`infra/newsletter-lambdas/`)
- **Purpose**: Serverless API and background processing for newsletter
- **Responsibilities**: HTTP handlers for subscribe/confirm/unsubscribe/formtoken/health; SQS consumer for bulk SES dispatch; transactional email via EventBridge
- **Dependencies**: DynamoDB, EventBridge, SQS, SES, Secrets Manager
- **Type**: Application (serverless)

### CloudFormation Stacks (`infra/*.yml`)
- **Purpose**: Infrastructure as code for AWS resources
- **Responsibilities**: Website hosting, multi-region failover, API domain, newsletter system, GitHub Actions IAM role
- **Dependencies**: AWS account, Route53 hosted zone
- **Type**: Infrastructure

### GitHub Actions (`.github/workflows/`)
- **Purpose**: Continuous integration and deployment
- **Responsibilities**: Build static site, sync to S3, invalidate CloudFront; deploy infra and Lambda changes
- **Dependencies**: GitHub OIDC, AWS IAM role
- **Type**: Infrastructure (CI/CD)

## Data Flow

### Content Publish Flow

```mermaid
sequenceDiagram
    participant Author
    participant Git
    participant GHA as GitHub Actions
    participant Build as npm run build
    participant S3 as S3 Website
    participant CF as CloudFront

    Author->>Git: Push MDX content to main
    Git->>GHA: Trigger deploy.yml
    GHA->>Build: prebuild + next build
    Build->>Build: Generate posts.json RSS sitemap mastodon.json
    Build->>Build: Static export to /out
    GHA->>S3: Sync /out with cache headers
    GHA->>CF: Invalidate /*
    CF->>Author: Updated site live
```

### Newsletter Subscribe Flow

```mermaid
sequenceDiagram
    participant User
    participant Site as Static Site
    participant API as API Gateway
    participant FT as formtoken Lambda
    participant SUB as subscribe Lambda
    participant DDB as DynamoDB
    participant EB as EventBridge
    participant EM as email Lambda
    participant SES as SES

    User->>Site: Visit /newsletter
    Site->>API: GET /formtoken
    API->>FT: Generate short-lived token
    FT-->>Site: formToken
    User->>Site: Submit email + token
    Site->>API: POST /subscribe
    API->>SUB: Validate honeypot + token
    SUB->>DDB: Write PENDING subscriber
    SUB->>EB: SignupRequested event
    EB->>EM: Trigger confirmation email
    EM->>SES: Send confirmation
    SES->>User: Confirmation email
    User->>Site: Click confirm link
    Site->>API: POST /confirm
    API->>DDB: Set ACTIVE
```

### Newsletter Campaign Send Flow

```mermaid
sequenceDiagram
    participant Author
    participant CLI as blog email:send
    participant EB as EventBridge
    participant SQS as SQS Queue
    participant DSP as dispatch Lambda
    participant DDB as DynamoDB
    participant SES as SES

    Author->>CLI: blog email:send slug
    CLI->>CLI: Render MDX to HTML
    CLI->>EB: NewsletterSendRequested
    EB->>SQS: Enqueue dispatch job
    SQS->>DSP: Trigger batch processing
    DSP->>DDB: Query ACTIVE subscribers
    DSP->>DDB: Check send idempotency
    loop Batches of 50
        DSP->>SES: SendBulkTemplatedEmail
        DSP->>DDB: Record SENT or FAILED
    end
```

## Integration Points

### External APIs
| Integration | Purpose | Where Used |
|-------------|---------|------------|
| Mastodon API (`micah.social`) | Fetch public toots for `/micro` archive | `scripts/fetch-mastodon.js` (prebuild) |
| Newsletter API (`api.micahwalter.com`) | Subscribe, confirm, unsubscribe, form tokens | `components/SubscribeForm.tsx`, `ConfirmHandler.tsx`, `UnsubscribeForm.tsx` |
| AWS Bedrock | AI photo tagging via Claude Vision | `scripts/tag-photos.js` (authoring only) |
| Fathom Analytics | Privacy-friendly pageview tracking | `components/Fathom.tsx` |

### Databases
| Store | Purpose |
|-------|---------|
| DynamoDB `newsletter_subscribers` | Subscriber records with StatusIndex GSI |
| DynamoDB `newsletter_sends` | Per-subscriber send idempotency tracking |
| File system `content/posts/` | Primary content store (MDX) |

### Third-party Services
| Service | Purpose |
|---------|---------|
| Amazon SES | Transactional and bulk newsletter email |
| Amazon S3 | Static site hosting, image storage |
| Amazon CloudFront | CDN for site and images |
| Route53 | DNS with health-check failover for API |
| Secrets Manager | HMAC signing keys for tokens |

## Infrastructure Components

### CloudFormation Stacks
| Stack | Template | Region | Purpose |
|-------|----------|--------|---------|
| `micahwalter-www` | `infra/infra.yml` | us-east-1 | Primary website + images + CloudFront + DNS |
| `micahwalter-www-secondary` | `infra/infra-secondary.yml` | us-east-2 | Failover S3 buckets |
| `micahwalter-api-domain` | `infra/api-domain.yml` | us-east-1 | Shared API custom domain |
| `micahwalter-api-domain-secondary` | `infra/api-domain-secondary.yml` | us-east-2 | Secondary API domain |
| `micahwalter-newsletter` | `infra/newsletter.yml` | us-east-1 | Full newsletter system |
| `micahwalter-newsletter-secondary` | `infra/newsletter-secondary.yml` | us-east-2 | Secondary API (no dispatch) |
| `micahwalter-www-github-actions` | `infra/github-actions-role.yml` | us-east-1 | OIDC deploy role |

### Deployment Model
- **Site**: GitHub Actions builds `/out`, syncs to S3, invalidates CloudFront (~3-4 min)
- **Images**: Separate manual/CLI workflow via `blog images:sync --profile www` (not in site CI)
- **Newsletter Lambdas**: Auto-deploy on push to main when Go source or templates change; fast path uses `update-function-code`, full path uses CloudFormation deploy
- **Multi-region**: S3 cross-region replication for website and images; Route53 failover routing for API domain

### Networking
- Public CloudFront distributions for `www.micahwalter.com` and apex redirect
- API Gateway HTTP API mapped to `api.micahwalter.com` via shared custom domain
- No VPC; all services are managed AWS serverless/public endpoints
