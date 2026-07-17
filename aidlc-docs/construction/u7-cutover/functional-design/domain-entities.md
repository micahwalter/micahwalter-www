# U7 — Domain Entities (Cutover)

U7 primarily operates on existing Photo / Gallery records plus ops entities.

## PhotoRecord (existing — migration mapping)

| Field | Migration source | Notes |
|-------|------------------|-------|
| `id` | frontmatter `id` | Required; stable PK |
| `title` | frontmatter | |
| `caption` / body | single caption field | Align with U1 schema |
| `tags` | frontmatter tags | Array |
| `featured` | frontmatter | Boolean |
| `publishedAt` | frontmatter | ISO date |
| `draft` | frontmatter | Default false |
| `type` | `photo` | Constant |
| EXIF | frontmatter / derived | Preserve when present |
| `lat`/`lon` (private) | EXIF or S3 original backfill | Not public precise |
| Image keys / folder | derived from post folder + S3 layout | Must match CDN paths |
| Enrichment status | optional | May set `pending`/`done` if tagging deferred |

## MigrationReport

| Field | Meaning |
|-------|---------|
| `scanned` | Photo folders found |
| `planned` | Records that would upsert |
| `applied` | Successful writes (`--apply`) |
| `skipped` | Missing id / invalid / already identical |
| `failed` | Errors with message per id |
| `mode` | `dry-run` \| `apply` |

## ContentCleanupPlan

| Field | Meaning |
|-------|---------|
| `photoFolders` | Paths under `content/posts/` to remove |
| `galleryFolders` | Paths under `content/galleries/` to remove |
| `retained` | Blog/email folders kept |
| `mode` | `dry-run` \| `apply` |

## FeedSnapshot (photo fragment)

| Field | Meaning |
|-------|---------|
| `photoIds` | Ordered published photo ids included |
| `entries` | Title, url `/photos/<id>`, publishedAt, optional excerpt |
| `generatedAt` | Job timestamp |
| `artifact` | Target RSS and/or sitemap fragment/path |

## PhotosCLI Command (logical)

| Command | Input | Effect |
|---------|-------|--------|
| `photos:import` | local dir, flags (featured, dry-run, profile) | Images to S3 + PhotoRecord via API |
| `photos:tag` | id or `--all`, auto-approve flags | Enrichment/retag against DB |

## MultiRegionPosture (logical)

| Concept | Meaning |
|---------|---------|
| Primary | us-east-1 photo + gallery data plane |
| Secondary | Replica/failover consistent with tickets/images/API |
| RPO/RTO | Match peer stacks (detail in NFR/Infra) |
