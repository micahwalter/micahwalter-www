# U1 — Tech Stack Decisions

## Confirmed stack

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Runtime | **Node.js** (existing photo-upload Lambdas) | Reuse exif/optimize/auth code; plan locked Node |
| API | **API Gateway HTTP API** on `api.micahwalter.com/photos` | Extend `micahwalter-photo-upload` |
| Data store | **Amazon DynamoDB** (on-demand) | Photo metadata; personal traffic |
| Auth | Existing **passcode → HMAC** lib | PATCH only; process uses IAM |
| AWS SDK | **AWS SDK v3** for JS | Match current Lambda deps style |
| Region | **us-east-1** | Match current stack |
| IaC | **CloudFormation** (`infra/photo-upload.yml` + lambda package) | Existing deploy path |
| Tickets | Existing **tickets HTTPS API** | id allocation |
| Queues (enqueue only) | SQS/EventBridge **stub/contract** for enrichment message | Full enricher is U2; U1 must enqueue after put |

## Explicitly deferred

| Item | Defer to |
|------|----------|
| DynamoDB global tables / multi-region | U7 |
| API CDN caching / CloudFront on GETs | Later / if needed |
| Bedrock + AWS Location | U2 |
| API Gateway custom throttles | Later |
| SNS alarms | Later |

## Pagination defaults

- `limit` default **12**, max **50**
- Opaque cursor; sort `publishedAt` DESC, `id` DESC
