# U7 — Tech Stack Decisions

## Confirmed stack

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Photo/gallery metadata | Existing **DynamoDB** tables in primary (us-east-1) | Match tickets: secondary compute reaches primary table |
| Multi-region mechanism | **Secondary stack in us-east-2** + shared `api.micahwalter.com` failover mapping; Secrets Manager **ReplicaRegions** | Mirror `tickets-secondary` / `api-domain-secondary` (not necessarily DDB global tables) |
| Secondary compute/API | **us-east-2** `photo-upload-secondary` (or equivalent) | Peer API stacks |
| Secrets | Secrets Manager with **ReplicaRegions: us-east-2** | Match `ticket-server-secrets` |
| Images | Existing **S3 CRR** + CloudFront origin group (no re-key) | NFR-5; already live |
| Feed publisher | **EventBridge schedule → Lambda** (Node, primary us-east-1) writing RSS/sitemap artifacts (S3 and/or repo path as Infra decides) | FR-9; no full Next build |
| Migration / cleanup | **Node scripts** under `scripts/` (dry-run / `--apply`) | U6 gallery migrator pattern |
| CLI | Extend **`blog photos:import` / `photos:tag`** → photo API + tickets | FR-10 |
| Auth | Existing **passcode → HMAC** | U1–U6 |
| Region primary | **us-east-1** | Current stacks |
| Region secondary | **us-east-2** | Images/website secondary + newsletter/tickets secondary |
| IaC | **CloudFormation** + existing GitHub Actions deploy paths | Consistency |
| Runtime | **Node.js 20** for photo-upload / feed Lambda; CLI remains Node | Existing |

## Explicitly deferred / out of U7 product scope

| Item | Notes |
|------|-------|
| API CDN caching on GETs | Still not required |
| New SNS/alarm suite | Optional follow-up |
| Gallery CLI | Optional; web admin is v1 |
| Security / Resiliency / PBT extensions | Disabled |
| Bedrock in secondary | Soft-fail enrichment; primary Bedrock sufficient unless Infra requires secondary invoke (document if skipped) |

## Multi-region acceptance bar

1. Secondary photo API stack deployed in us-east-2 (read/write via primary DynamoDB ARNs, tickets-style).  
2. ApiMapping on secondary `api.micahwalter.com` domain + Route53 failover posture consistent with peers.  
3. Photo-upload secrets replicated to us-east-2.  
4. Images failover unchanged via CloudFront origin groups.  
5. Runbook documents failover expectations (secondary compute; primary data plane).
