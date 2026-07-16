# U2 — Domain Entities

**Unit**: Enrichment  
**Stories**: US-003, US-004  
**Locked decisions**: Plan answers Q1–Q12 (2026-07-16)

---

## Photo (enrichment fields — extends U1)

U2 updates the existing Photo aggregate. New/clarified fields:

| Field | Type | Notes |
|-------|------|-------|
| `latitude` / `longitude` | number \| null | Precise GPS; written by enricher from S3 original EXIF when present |
| `publicLatitude` / `publicLongitude` | number \| null | Fuzzed (~3 decimal places); null when no GPS |
| `city` | string \| null | Reverse-geocode municipality (or region substitute); also mirrored into `tags` |
| `country` | string \| null | Reverse-geocode country; also mirrored into `tags` |
| `tags` | string[] | Union of existing + geo tag forms + AI tags; case-normalized; de-duped |
| `enrichmentStatus` | `pending` \| `complete` \| `failed` | See business rules |
| `updatedAt` | string (ISO-8601) | Bumped on enrichment write |

Unchanged by enrichment: `id`, `title`, `caption`, `publishedAt`, `createdAt`, `featured`, `draft`, image keys, non-GPS `exif` (except enricher may refresh GPS-related storage only via lat/lon fields).

### Invariants
- Public DTO **never** includes precise `latitude` / `longitude`
- Enrichment **never** overwrites `title` or `caption`
- Missing GPS ⇒ geo fields stay null; Bedrock still runs
- `city` / `country` when set are also represented as lowercase hyphenated entries in `tags[]`

## PublicPhotoDTO (U2 additions)

U1 public fields plus:

- `publicLatitude`, `publicLongitude` (may be null)
- `city`, `country` (may be null)
- `tags` (may include geo + AI after enrichment)
- `enrichmentStatus`

## EnrichmentMessage (transient)

| Field | Type | Notes |
|-------|------|-------|
| `photoId` | string | From EventBridge `PhotoPendingEnrichment` detail |

Trigger: EventBridge rule on `photo-bus` → Enrichment Lambda (direct).

## EnrichmentContext (transient)

In-worker working set (not a DynamoDB entity):

- Loaded Photo  
- Optional original image bytes (GPS extract)  
- Optional optimized cover bytes (Bedrock)  
- Extracted precise coords  
- Fuzzed public coords  
- Reverse-geocode city/country  
- Bedrock tag list  
- Merged tag list  

## PlaceLabel (value object)

| Field | Type | Notes |
|-------|------|-------|
| `city` | string \| null | Municipality; if missing, region/state substitute |
| `country` | string \| null | Country name |
| `cityTag` / `countryTag` | string | Lowercase hyphenated forms for `tags[]` |

## AiTagSet (value object)

- 3–8 lowercase hyphenated content tags from Bedrock vision  
- Tags only — no title/caption suggestions  

## Relationships

```text
EnrichmentMessage --identifies--> Photo
EnrichmentContext --reads S3 original--> GPS coords
EnrichmentContext --reads S3 optimized--> AiTagSet
EnrichmentContext --calls Location--> PlaceLabel
EnrichmentContext --merges into--> Photo (tags, geo, status)
Photo --projected as--> PublicPhotoDTO
```
