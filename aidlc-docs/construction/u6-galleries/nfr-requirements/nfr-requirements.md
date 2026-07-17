# U6 — NFR Requirements

**Unit**: Galleries  
**Decisions**: Derived from U1/App Design/FD (Q1–Q6=A)

---

## Scalability

| ID | Requirement |
|----|-------------|
| NFR-U6-S1 | Personal / low traffic: few galleries, small membership lists (tens of photos each). |
| NFR-U6-S2 | DynamoDB **on-demand** for galleries table; default Lambda concurrency. |
| NFR-U6-S3 | Multi-region gallery table **out of scope for U6** (U7 / NFR-3). |

## Performance

| ID | Requirement |
|----|-------------|
| NFR-U6-P1 | **Best effort** — no hard SLO. Soft goal: gallery pages interactive within a couple of seconds warm. |
| NFR-U6-P2 | Resolve membership photos with modest parallel GETs (e.g. 3–5); skip missing ids; **no** new batch-get API in U6. |
| NFR-U6-P3 | Gallery list sizes expected small — single-page list acceptable (no cursor required unless natural). |

## Caching

| ID | Requirement |
|----|-------------|
| NFR-U6-C1 | **No CDN/API response caching** for gallery GETs in U6 (align U1). |

## Availability / reliability

| ID | Requirement |
|----|-------------|
| NFR-U6-R1 | Public UI: error + **Retry**; no markdown gallery fallback after cutover wiring. |
| NFR-U6-R2 | Missing photo ids in membership → skip tile (no hard fail of whole gallery). |
| NFR-U6-R3 | Migration: **idempotent upsert by slug**; support dry-run; do not delete markdown files in U6. |

## Security

| ID | Requirement |
|----|-------------|
| NFR-U6-SEC1 | Public GET galleries (non-draft only) unauthenticated. |
| NFR-U6-SEC2 | Create/update/membership require HMAC token (same as upload/edit). |
| NFR-U6-SEC3 | No gallery delete API in U6. |
| NFR-U6-SEC4 | Least-privilege IAM on galleries table for the photos-api (or galleries handler) role. |

## SEO / static export

| ID | Requirement |
|----|-------------|
| NFR-U6-SEO1 | Client-rendered gallery pages OK (align U4); placeholder `generateStaticParams` + CF shell rewrite if needed for `/galleries/<slug>`. |

## Observability

| ID | Requirement |
|----|-------------|
| NFR-U6-O1 | CloudWatch logs for gallery API handlers; **no new SNS alarms** in U6. |

## Maintainability

| ID | Requirement |
|----|-------------|
| NFR-U6-M1 | Ship in existing `micahwalter-photo-upload` stack + lambda zip; extend `lib/photos-api.ts` + hub tab. |
| NFR-U6-M2 | Migration script documented; dry-run by default recommended. |
