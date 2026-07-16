# U2 — Business Logic Model

**Unit**: Enrichment  
**Stories**: US-003 (AI tags), US-004 (GPS / fuzz / city-country)  

---

## Purpose

Asynchronously enrich a pending Photo with privacy-safe public geo, structured place fields, and Bedrock vision tags — without blocking upload ACK and without modifying title/caption.

## Primary workflow — Enrich photo

```text
EventBridge PhotoPendingEnrichment { photoId }
  -> Enrichment Lambda
  -> load Photo by id
  -> if enrichmentStatus == complete: STOP (no-op)
  -> load S3 original (originalKey); extract GPS if present
  -> if GPS:
       store precise lat/lon
       fuzz to 3 decimals -> publicLatitude/publicLongitude
       AWS Location reverse geocode
         -> city (or region substitute) + country
         -> tag forms into tags[]
  -> else: skip geo (fields remain null)
  -> load optimized cover from images bucket
  -> Bedrock vision tags (3-8); on failure log and continue
  -> union-merge tags (existing + geo + AI); de-dupe; normalize case
  -> persist Photo fields + enrichmentStatus=complete (or failed on hard error)
  -> DONE
```

### Text alternative (no diagram chars beyond ASCII)

1. Message arrives with `photoId`.  
2. Skip if already `complete`.  
3. Geo path optional; Bedrock path best-effort.  
4. Single enrichment write with merged results.  
5. Public visibility unchanged throughout.

## Transformations

| Input | Output |
|-------|--------|
| Original image EXIF GPS | `latitude`, `longitude` |
| Precise coords | `publicLatitude`, `publicLongitude` (3 dp) |
| Location reverse-geocode | `city`, `country` + tag strings |
| Optimized cover + Bedrock | AI tag list |
| Existing tags + geo + AI | Merged `tags[]` |

## Ordering

Preferred step order: **GPS/geo first**, then **Bedrock**, then **persist**. Failures in one step do not undo the other; final status follows BR-U2-19 / BR-U2-20.

## Out of scope for U2 logic

- Upload UI / multi-file (U3)  
- Public browse/detail/map rendering (U4)  
- Authenticated edit UI (U5)  
- CLI retag backfill UX (U6/U7; may reuse merge rules later)  
- Changing U1 EventBridge emit contract beyond consuming `{ photoId }`  

## Story coverage

| Story | Logic coverage |
|-------|----------------|
| US-003 | Bedrock on optimized cover; merge tags; no title/caption overwrite; soft-fail |
| US-004 | GPS from original; precise + fuzzed public; city/country fields + tags; skip if no GPS |
