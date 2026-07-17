# Integration Test Instructions — Issues #103 / #104 (U1–U7)

## Purpose

Verify units work together against live (or staging) AWS + static site.

## Prerequisites

- Primary `micahwalter-photo-upload` deployed (photos + galleries + enrich + feed publisher)
- `NEXT_PUBLIC_PHOTO_API_URL` baked into site build
- Operator AWS profile `www` + photo upload passcode
- Optional: secondary stack deployed for failover checks

## Scenario matrix

### S1 — Upload → DynamoDB → browse (U1/U3/U4)

1. Open `/upload`, unlock with passcode  
2. Upload 1–2 JPEG/PNG with captions  
3. Wait for process Lambda  
4. `GET /photos/featured` and `GET /photos?limit=12` include new ids  
5. Homepage hero / `/photos` show new photos **without** waiting for site deploy  

**Expected:** Photos live via API; no new photo `index.md` commit.

### S2 — Enrichment (U2)

1. After upload, wait for enricher (or check CloudWatch `photo-upload-enrich`)  
2. `GET /photos/{id}` shows tags and/or fuzzed map when GPS present  
3. Soft-fail: photo still public if Bedrock unavailable  

### S3 — Edit hub (U5)

1. With token in sessionStorage, open `/upload?edit=<id>` or Edit from detail  
2. PATCH title/caption/tags/featured  
3. Public detail reflects changes immediately  

### S4 — Galleries (U6)

1. Hub → Galleries: create gallery, set membership  
2. `GET /photos/galleries` and `GET /photos/galleries/{slug}`  
3. Public `/galleries` and `/galleries/{slug}` render tiles → `/photos/{id}`  
4. `node scripts/migrate-galleries.js --apply` (once) for markdown galleries  

### S5 — Cutover migrate (U7)

```bash
node scripts/migrate-photos.js          # dry-run
node scripts/migrate-photos.js --apply  # write
# optional: --gps
```

1. Spot-check migrated ids via API  
2. `/posts/<digits>` → 301 `/photos/<id>`  
3. Search includes migrated photos  

### S6 — Feeds (U7)

1. Invoke `photo-upload-feed-publisher` or wait ≤1h  
2. `https://www.micahwalter.com/photos-feed.xml` lists `/photos/{id}`  
3. `sitemap-photos.xml` present  
4. Blog `feed.xml` still from prebuild  

### S7 — CLI (U7)

```bash
blog photos:import ./fixture --dry-run
blog photos:tag <id> --dry-run --profile www
```

**Expected:** Import path documents DynamoDB SoT; tag reads/writes DB (apply only when intentional).

### S8 — Secondary API (U7 / US-016)

1. Confirm us-east-2 stack + ApiMapping `photos`  
2. Call secondary execute-api URL or failover path for `GET /photos/`  
3. Reads hit primary DynamoDB  

### S9 — Cleanup (U7, destructive)

Only after S5 verify:

```bash
node scripts/cleanup-photo-content.js --apply --galleries
npm run build
```

**Expected:** Build green; blog/email remain; photo/gallery markdown gone.

## Auth negative checks

| Call | Expected |
|------|----------|
| PATCH `/photos/{id}` without Bearer | 401 |
| POST `/photos/galleries` without Bearer | 401 |
| GET public list/detail | 200, no precise GPS |

## Cleanup after tests

- Leave migrated production data  
- Delete only intentional test uploads via future delete (none in U6/U7) or leave as draft  
- Do not re-run cleanup against prod without verify  

## Logs

| Component | Where |
|-----------|-------|
| process / enrich / photos-api / feed-publisher | CloudWatch Log Groups `/aws/lambda/photo-upload-*` |
| Site deploy | GitHub Actions `deploy.yml` |
| Secondary | us-east-2 Lambda log groups |
