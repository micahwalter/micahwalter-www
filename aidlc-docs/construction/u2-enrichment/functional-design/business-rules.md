# U2 — Business Rules

**Unit**: Enrichment  
**Stories**: US-003, US-004  

---

## Trigger & identity

| ID | Rule |
|----|------|
| BR-U2-01 | Enrichment starts from EventBridge `PhotoPendingEnrichment` with detail `{ photoId }` on `photo-bus`. |
| BR-U2-02 | EventBridge rule invokes Enrichment Lambda **directly** (no SQS requirement for U2 functional design). |
| BR-U2-03 | Worker loads Photo by `photoId`; if missing → log and exit (no retry storm on bad ids after limited retries — infra details later). |

## Idempotency

| ID | Rule |
|----|------|
| BR-U2-04 | If `enrichmentStatus === complete` → **no-op** (skip Bedrock/Location). |
| BR-U2-05 | If status is `pending` or `failed` → run enrichment and merge. |

## GPS ownership & geo

| ID | Rule |
|----|------|
| BR-U2-06 | **Enricher owns GPS extraction** — read original from S3 (`originalKey`); extract precise lat/lon when present. U1 process need not write GPS. |
| BR-U2-07 | If no GPS in EXIF → skip reverse-geocode and fuzzing; leave `latitude`, `longitude`, `publicLatitude`, `publicLongitude`, `city`, `country` null. |
| BR-U2-08 | If GPS present → store precise `latitude`/`longitude` on the record (internal only). |
| BR-U2-09 | Public coords = round lat/lon to **3 decimal places** (~110m); store as `publicLatitude`/`publicLongitude`. |
| BR-U2-10 | Reverse-geocode precise coords via AWS Location; prefer municipality/city + country; if city missing, use region/state as city substitute. |
| BR-U2-11 | Persist `city` and `country` string fields when obtained; also merge `cityTag` and `countryTag` (lowercase, hyphenated) into `tags[]`. |

## Bedrock AI tags

| ID | Rule |
|----|------|
| BR-U2-12 | Invoke Bedrock vision with **same prompt intent and model family** as `scripts/tag-photos.js` (`us.anthropic.claude-sonnet-4-6` / Converse): 3–8 lowercase hyphenated tags; comma-separated parse. |
| BR-U2-13 | Image input = **optimized cover** from images bucket (process variants / cover key), not the original. |
| BR-U2-14 | AI must **not** invent or overwrite `title` or `caption`. |
| BR-U2-15 | Soft-fail: Bedrock errors are logged; enrichment may still complete with geo-only / existing tags. |

## Tag merge

| ID | Rule |
|----|------|
| BR-U2-16 | **Union merge, case-normalized**: start from existing `tags`; add geo tags + AI tags; de-dupe; never remove prior tags during enrichment. |
| BR-U2-17 | Default seed tag `photography` (from U1 create) is retained. |

## Status & partial failure

| ID | Rule |
|----|------|
| BR-U2-18 | Steps are **best-effort and independent** — persist whatever succeeded; do not roll back a successful geo write because Bedrock failed (or vice versa). |
| BR-U2-19 | Set `enrichmentStatus = complete` when the worker finishes an attempt (geo skipped OK if no GPS; Bedrock soft-fail OK). |
| BR-U2-20 | Set `enrichmentStatus = failed` only when the worker cannot complete/update the record after its retry budget (crash / hard update failure). |
| BR-U2-21 | Photo remains **publicly listable/gettable** regardless of `pending` / `complete` / `failed`. |

## Privacy

| ID | Rule |
|----|------|
| BR-U2-22 | Public API / PublicPhotoDTO never expose precise `latitude`/`longitude`. |
| BR-U2-23 | Maps (U4) use `publicLatitude`/`publicLongitude` only. |
