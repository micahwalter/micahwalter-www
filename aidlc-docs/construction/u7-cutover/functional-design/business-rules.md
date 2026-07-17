# U7 — Business Rules (Cutover)

| ID | Rule |
|----|------|
| BR-U7-01 | Photo migration **upserts by numeric `id`**; never invents a new id for an existing markdown photo. |
| BR-U7-02 | Migration is **idempotent**: re-run updates same records; no duplicate rows. |
| BR-U7-03 | Default migrator mode is **dry-run**; writes require explicit `--apply`. |
| BR-U7-04 | GPS backfill from originals only when EXIF GPS exists; public responses continue to expose **fuzzed** geo only. |
| BR-U7-05 | Failed rows are reported and re-runnable; success of others is not rolled back (best-effort batch). |
| BR-U7-06 | Content cleanup runs **only after** migrated ids are readable via public API (verification gate). |
| BR-U7-07 | After cleanup, `content/posts/` must contain **no** `type: photo` folders. |
| BR-U7-08 | Photo upload/process **must not** write or commit photo markdown. |
| BR-U7-09 | CLI import/tag treats DynamoDB/API as SoT; local markdown for photos is not required. |
| BR-U7-10 | Feed job photo links use `/photos/<id>` only (never `/posts/<id>` for photos). |
| BR-U7-11 | Feed job must not require or trigger a full static site rebuild. |
| BR-U7-12 | Blog/email markdown generation and routes remain authoritative for non-photo content. |
| BR-U7-13 | Multi-region posture for photos/galleries must be **on par** with peer API stacks (NFR-3); staging with tracked follow-up only if infra blocks — default is implement in U7. |
| BR-U7-14 | Draft photos remain non-public on list/detail unless admin auth (existing U1 rules). |
| BR-U7-15 | Gallery markdown may be deleted only after U6 migrate verification (or same verified cleanup window). |
