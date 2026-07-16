# U2 — Deployment Architecture

## Runtime topology (us-east-1)

```text
S3 ObjectCreated -> Process Lambda (U1)
  -> DynamoDB put (pending)
  -> EventBridge PutEvents PhotoPendingEnrichment { photoId }
       |
       v
  photo-bus
       |-- rule photo-pending-enrichment --> Enrich Lambda (60s/1024MB)
       |                                      |-> S3 Get original (GPS)
       |                                      |-> Location Place Index
       |                                      |-> S3 Get photo-1200.* (Bedrock)
       |                                      |-> Bedrock Converse
       |                                      +-> DynamoDB UpdateItem
       |
       +-- archive (14 days) for replay

Client GET /photos* -> Photos API Lambda -> DynamoDB
  (DTO includes city/country/public coords when enriched)
```

### Text alternative

1. Process still persists the photo and emits `PhotoPendingEnrichment`.  
2. EventBridge rule invokes the enricher asynchronously.  
3. Enricher loads the photo, skips if already `complete`, then GPS/Location/Bedrock.  
4. One DynamoDB update writes geo, tags, and status.  
5. Failed deliveries can be recovered by replaying the bus archive (no enricher DLQ).

---

## Deploy pipeline

| Step | Mechanism |
|------|-----------|
| Build zip | `infra/photo-upload-lambdas` `make build` (includes enrich handler) |
| Upload | S3 artifacts bucket `photo-upload/lambda/photo-upload.zip` |
| Stack | CloudFormation `micahwalter-photo-upload` via `photo-upload-deploy.yml` |
| CI IAM first | Redeploy `micahwalter-www-github-actions` after role policy update |
| Bedrock | Manual model access enablement in us-east-1 |

## Workflow code-only path

Update `.github/workflows/photo-upload-deploy.yml` function list to include `enrich` alongside `auth`, `init`, `process`, `photos-api`.

## Environments

| Env | Notes |
|-----|-------|
| Production | us-east-1 only for U2 |
| Local | Enricher not run locally by default; optional unit-level mocks later |

## Rollback

1. Disable EventBridge rule or point target away from enricher.  
2. Redeploy prior zip/template.  
3. Photos remain readable; enrichment fields may be partial until replay/backfill.  
