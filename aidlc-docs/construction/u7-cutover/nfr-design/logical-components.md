# U7 — Logical Components

Minimal set. Infrastructure binding → Infrastructure Design.

---

## PhotoMigrator

- **Role**: Scan photo markdown → upsert PhotoRecord by stable `id`; optional GPS backfill from S3 originals  
- **NFR**: dry-run / `--apply`; idempotent; concurrency ≤5; stdout MigrationReport  
- **Auth**: HMAC (or IAM if run in-account with direct DDB — prefer API for parity with CLI)

## ContentCleanup

- **Role**: After verify, remove `content/posts` photo folders + `content/galleries` markdown  
- **NFR**: dry-run / `--apply`; never touch blog/email; build must stay green  
- **Surface**: Node script (+ optional PR)

## PhotosCLI

- **Role**: `blog photos:import` / `photos:tag` against photo API/DB  
- **NFR**: no photo `index.md` as SoT; reuse passcode auth; tag soft-fails like U2  
- **Host**: existing `cli/` + `scripts/`

## FeedPublisher

- **Role**: Scheduled job reads published photos → updates RSS/sitemap **photo** entries with `/photos/<id>`  
- **NFR**: no full site rebuild; soft-fail; paginated list; atomic artifact replace  
- **Trigger**: EventBridge schedule (primary us-east-1)

## FeedArtifactStore

- **Role**: Persist generated feed/sitemap photo fragments (S3 object and/or agreed public path)  
- **NFR**: readable by CDN/site consumers as designed in Infra  

## PhotoUploadSecondary

- **Role**: us-east-2 deploy of photos API (+ auth/init as peer stacks require) for failover  
- **Data**: Cross-region access to **primary** photos + galleries DynamoDB tables  
- **NFR**: Secrets replica; ApiMapping on secondary api-domain; least-privilege IAM  

## AuthVerifier (reuse)

- **Role**: HMAC verify for migrator/CLI/admin writes  

## PublicDtoProjector (reuse)

- **Role**: Strip precise GPS / internal fields on public reads (primary + secondary)

## ProcessCommitRemover

- **Role**: Ensure process Lambda has no GitHub commit of photo markdown; delete/disable dead `github.js` usage  
- **NFR**: FR-11.3; verify no secret dependency on `githubToken` for process path (may remain unused)

## CutoverRunbook

- **Role**: Ordered ops checklist: migrate → verify → feeds deploy → secondary stack → cleanup  
- **NFR**: NFR-U7-M3  

---

## Explicitly not in U7 logical set

| Component | Reason |
|-----------|--------|
| MarkdownPhotoFallback | API-only surfaces |
| GalleryCLI | Optional; web admin is v1 |
| New alarm/SNS stack | NFR-U7-O2 |
| ImageRekeyJob | NFR-5 — no re-key |

---

## Component → NFR map

| Component | Key NFRs |
|-----------|----------|
| PhotoMigrator | R3, P2, C1, SEC1 |
| ContentCleanup | R4, SEC3, C3 |
| PhotosCLI | F1, SEC1, M1 |
| FeedPublisher | F2–F4, R5, P3, O1 |
| FeedArtifactStore | F2, R5 |
| PhotoUploadSecondary | R1, S3, SEC4–5, M2 |
| ProcessCommitRemover | R4 / FR-11 |
| CutoverRunbook | M3 |
