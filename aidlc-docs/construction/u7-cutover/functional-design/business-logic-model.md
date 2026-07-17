# U7 — Business Logic Model (Cutover)

**Stories**: US-006, US-013, US-014, US-015, US-016  
**Decisions**: Full cutover; idempotent photo migrate; CLI→API; content cleanup; scheduled feeds; multi-region parity (mechanism in Infra).

---

## Cutover sequence (business order)

```text
1. PhotoMigrator (markdown -> DynamoDB, dry-run then apply)
2. Verify public API + /photos surfaces for migrated ids
3. Confirm galleries already on API (U6); optional galleries markdown cleanup
4. CLI PhotosCLI import/tag against API (no photo markdown SoT)
5. FeedPublisher scheduled job writes photo RSS/sitemap fragments
6. ContentCleanup removes photo folders (+ gallery md) after verify
7. MultiRegionParity for photo metadata/API (per NFR-3 / Infra)
```

No dual-write: process path remains DynamoDB-only (already U1+). U7 removes leftover commit helpers and markdown SoT.

---

## Flows

### F1 — Migrate existing photos (US-013)

1. Scan `content/posts/*/index.md` where `type: photo` (or equivalent photo frontmatter).  
2. For each folder, map frontmatter → PhotoRecord fields: `id`, title, caption, tags, featured, publishedAt, category, EXIF, image keys/folder, draft.  
3. Preserve **stable numeric id** from frontmatter (do not re-allocate tickets).  
4. If GPS missing in markdown but S3 original has EXIF GPS → backfill lat/lon (private); public geo remains fuzzed per U1/U4 rules.  
5. Upsert by `id` (idempotent). Dry-run lists planned puts; `--apply` writes.  
6. Report: migrated / skipped / failed; re-run safe for failures.  
7. Success criterion: `GET /photos/{id}` returns each migrated id.

### F2 — Verify + redirects (US-009 / US-013)

1. Spot-check homepage featured, `/photos`, `/photos/<id>`, search.  
2. Confirm `/posts/<numeric-id>` → 301 `/photos/<id>` for migrated set (U4 CF + local redirect).  
3. Blog/email routes unchanged.

### F3 — Stop markdown SoT + cleanup (US-014)

1. Assert process Lambda never commits photo `index.md` (already DDB path; delete/disable GitHub commit client if still present).  
2. After F1 verification: remove photo directories under `content/posts/`.  
3. Remove `content/galleries/*/index.md` after U6 migrate verified (or same cleanup PR).  
4. Remaining `content/posts/` = blog + email only; `npm run build` still succeeds.  
5. Cleanup may be a scripted PR or script + manual review; prefer script listing folders then delete with `--apply`.

### F4 — CLI parity (US-006 / FR-10)

1. `blog photos:import <dir>`:  
   - Upload/optimize images as today (or via existing S3 paths).  
   - Allocate id via ticket API if new; create PhotoRecord via authenticated photo API (or shared write path equivalent to process).  
   - Does **not** create/commit photo `index.md` as source of truth.  
2. `blog photos:tag [id|--all]`: retag/backfill against DB photo(s) via enrichment/API (reuse U2 merge rules).  
3. Gallery CLI optional — not required for U7 acceptance.

### F5 — Scheduled feeds (US-015 / FR-9)

1. Job runs on schedule (mechanism in Infra).  
2. Reads photo list from API/DB (published only).  
3. Updates RSS and/or sitemap **photo entries** with `/photos/<id>` URLs.  
4. Does not run full Next.js build.  
5. Blog markdown RSS/sitemap continue via existing `prebuild` scripts; job must not break blog entries (merge or photo-specific artifact as designed in Infra).

### F6 — Multi-region parity (US-016 / NFR-3)

1. Photo metadata store + read/write APIs follow primary us-east-1 + secondary posture consistent with tickets/images/API stacks.  
2. Galleries table follows same posture as photos.  
3. Exact replication (global tables, dual-stack deploy, etc.) specified in NFR Design / Infrastructure Design — FD requires **parity outcome**, not a specific AWS product.

---

## Out of scope

- Re-keying historical S3 image objects (NFR-5)  
- Gallery delete API  
- Changing giscus mapping beyond documenting pathname `/photos/<id>` if needed  
- Security/Resiliency/PBT extensions (disabled)
