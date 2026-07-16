# U2 — Tech Stack Decisions

## Confirmed stack

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Runtime | **Node.js 20** enricher in existing photo-upload package | FD + NFR Q9=A; reuse S3/Dynamo helpers |
| Trigger | **EventBridge rule** on `photo-bus` → Enrichment Lambda (direct) | FD Q10=A |
| Recovery | **EventBridge archive/replay** (no enricher SQS DLQ in U2) | NFR Q4=B |
| Vision | **Amazon Bedrock** Converse + `us.anthropic.claude-sonnet-4-6` | FD / CLI parity |
| Image input | Optimized cover from images bucket | FD Q6=A |
| Geocoding | **AWS Location Service** reverse geocode (Place Index details in Infra Design) | FD city/country |
| Data | Existing DynamoDB `micahwalter-photos` | U1 |
| AWS SDK | **AWS SDK v3** (S3, DynamoDB, Bedrock Runtime, Location) | Match stack |
| Region | **us-east-1** | NFR Q8=A |
| IaC | **CloudFormation** `infra/photo-upload.yml` + lambda zip | Existing deploy |
| Sizing | Timeout **60s**, memory **1024 MB** | NFR Q3=A |

## Explicitly deferred

| Item | Defer to |
|------|----------|
| Enricher SQS buffer / DLQ | Later if archive/replay proves insufficient |
| Reserved concurrency / Bedrock budget alarms | Later |
| Multi-region Bedrock/Location/table replica | U7 |
| Custom CloudWatch metrics / enricher error alarm | Later |
| Separate enricher deployment package | Not chosen |

## Model / prompt

- Same intent as `scripts/tag-photos.js`: 3–8 lowercase hyphenated tags; tags only  
- Parse comma-separated model output; merge per FD BR-U2-16  
