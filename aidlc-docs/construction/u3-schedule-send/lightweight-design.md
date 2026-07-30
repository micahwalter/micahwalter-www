# U3 Lightweight Design — Schedule + Production Send

**Unit**: U3  
**Issue**: #127

## Scope

Sunday 09:00 America/New_York: pick random eligible unsent public photo → allocate Exposure N → create archive → emit `NewsletterSendRequested` → stamp photo. Empty pool → SES notify AdminEmail. Dedicated counter table.

## Ordering / idempotency

1. Acquire daily run lock (`LOCK#YYYY-MM-DD` America/New_York) — skip if already held  
2. List candidates (`exposureEligible`, not draft, no `exposureSentAt`)  
3. Empty → SES admin notify; release not required (lock keeps quiet retries)  
4. Random pick → `allocateNextIssueNumber()` → `createExposure` → `PutEvents` campaign (`emailId=N`) → stamp photo (`exposureSentAt`, `exposureIssueNumber`) with condition `attribute_not_exists(exposureSentAt)`

## Infra

- `ExposureCounterTable` (PK `id`)  
- `ExposureOrchestratorFn` + IAM (photos read/update, exposures put, counter update, events PutEvents, ses SendEmail)  
- `AWS::Scheduler::Schedule` cron `0 9 ? * SUN *` timezone `America/New_York`  
- Env: tables, `ADMIN_EMAIL`, `NEWSLETTER_EVENT_BUS_NAME`, `SITE_URL`, `SES_FROM_ADDRESS` (= AdminEmail)
