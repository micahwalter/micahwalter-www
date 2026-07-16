# U1 — Deployment Architecture

## Runtime topology (us-east-1)

```text
Browser (later U3/U4)
  | HTTPS
  v
API Gateway HTTP API (PhotoApi) ---- api.micahwalter.com/photos
  |  GET list|featured|{id}
  |  PATCH {id}  (HMAC)
  |  POST auth, upload-url (existing)
  v
Lambda (same zip: auth, init, read, patch, process)
  |
  +--> DynamoDB micahwalter-photos (+ GSI1)
  +--> Secrets Manager photo-upload-secrets
  +--> S3 uploads (presign) / S3 images (optimize)
  +--> Tickets API (HTTPS)
  +--> EventBridge (PhotoPendingEnrichment)  .... U2 consumer later
  |
S3 ObjectCreated (uploads/incoming/)
  --> Process Lambda
        OnFailure --> SQS photo-upload-process-dlq
```

### Text alternative

1. Browser calls Photo API on the shared custom domain.  
2. Read/patch handlers use DynamoDB `micahwalter-photos`.  
3. Upload still presigns to the uploads bucket; S3 invokes Process.  
4. Process writes DynamoDB, emits EventBridge event, never commits to GitHub.  
5. Process async failures land on an SQS DLQ after retries.

---

## Deploy pipeline

| Step | Mechanism |
|------|-----------|
| Build zip | Existing `infra/photo-upload-lambdas` Makefile |
| Upload artifact | S3 `micahwalter-newsletter-artifacts` / `photo-upload/lambda` |
| Stack update | CloudFormation `micahwalter-photo-upload` via `.github/workflows/photo-upload-deploy.yml` (or manual deploy) |
| Secret | No change required for U1 beyond existing passcode/hmac/ticketsPasscode |

## IAM highlights (ProcessFn)

- `dynamodb:PutItem`, `GetItem`, `UpdateItem`, `Query` on `micahwalter-photos` + GSI  
- `events:PutEvents` on photo bus / source  
- Existing S3 read uploads + write images  
- Existing secrets read (without needing GitHub token in code)  
- Network egress for tickets HTTPS  

## IAM highlights (read/patch handlers)

- DynamoDB read (and UpdateItem for PATCH)  
- Secrets read for HMAC verify (patch only)  

## Environments

| Env | Notes |
|-----|-------|
| Production | us-east-1 stack as today |
| Local | Next.js later calls prod/dev API URL via env; no local DynamoDB required for U1 backend work |

## Rollback

- Redeploy previous Lambda zip + CFN template revision.  
- DynamoDB table/data remains (PITR available).  
- Restoring markdown commit behavior requires redeploying pre-U1 process code (accepted; no dual-write).
