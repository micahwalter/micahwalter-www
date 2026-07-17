# U6 — Tech Stack Decisions

## Confirmed stack

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Runtime | Node.js Lambdas (existing photo-upload package) | Match U1/U2 |
| API | HTTP API routes under `api.micahwalter.com/photos` — `/galleries` | App Design |
| Handler | Extend **photos-api** Lambda (same zip) | Q2=A |
| Data store | **New** DynamoDB table `micahwalter-galleries` (on-demand), PK=`slug` | Q1=A / FD |
| Auth | Existing passcode → HMAC | US-011 |
| Frontend | Next.js client islands + `lib/photos-api.ts` | FD Q4=A |
| Region | us-east-1 | Match stack |
| IaC | `infra/photo-upload.yml` + lambda package | Existing deploy |
| Migration | Script upsert by slug; dry-run; keep markdown files | Q6=A / NFR-U6-R3 |

## Explicitly deferred

| Item | Defer to |
|------|----------|
| Multi-region galleries table | U7 |
| API CDN caching | Later |
| Batch GetItem photos API | Later / if needed |
| Gallery delete | Later |
| Markdown gallery file deletion | U7 cleanup |
| New CloudWatch alarms | Later |

## Membership resolution

- Client or API aggregates PublicPhoto via parallel `GET /{id}` (concurrency capped).
- Skip 404s when rendering.
