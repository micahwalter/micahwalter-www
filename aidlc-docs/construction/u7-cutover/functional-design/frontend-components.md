# U7 — Frontend / Operator Surfaces

U7 is primarily ops + CLI + scheduled jobs. Public UI already API-backed (U4/U6). No new visitor-facing marketing UI.

## Public site (verify only)

| Surface | Expectation after cutover |
|---------|---------------------------|
| Homepage hero / recent photos | API data; populated once migrate applied |
| `/photos`, `/photos/[id]` | Full catalog from DynamoDB |
| Search photo merge | Live API results |
| `/galleries` | API (U6); markdown galleries removable |
| Blog `/posts/<slug>` | Unchanged markdown |
| Legacy `/posts/<digits>` | 301 → `/photos/<id>` |

No new React pages required for cutover acceptance beyond fixing empty states copy if migrate not yet run in an environment.

## Operator / CLI (primary U7 “UI”)

| Surface | Role |
|---------|------|
| `scripts/migrate-photos.js` (or equivalent) | Dry-run / `--apply` photo markdown → API |
| `scripts/cleanup-photo-content.js` (or equivalent) | List/remove photo (+ gallery md) folders |
| `blog photos:import` | Desktop import → API/DB |
| `blog photos:tag` | Retag / backfill |
| FeedPublisher job logs | CloudWatch / CI visibility that RSS/sitemap photo URLs updated |

## Admin hub (`/upload`)

| Change | Notes |
|--------|-------|
| None required for cutover | Upload / Edit / Galleries already live |
| Optional: post-migrate empty-state copy | Only if helpful; not a gate |

## API integration points

| Actor | Endpoints |
|-------|-----------|
| PhotoMigrator | Authenticated create/upsert (or process-equivalent write) + public GET verify |
| PhotosCLI import | Auth + upload-url or direct S3 + create photo metadata |
| PhotosCLI tag | Auth + enrichment trigger / PATCH tags |
| FeedPublisher | Public list photos (paginated) → write feed artifacts to S3 (or agreed target) |
| ContentCleanup | Filesystem/git only (no API) after verify |

## Validation / UX rules (CLI)

- Clear dry-run vs apply banners  
- Per-id success/fail lines  
- Non-zero exit on any failed `--apply` row (or summary exit code documented in Code Gen)
