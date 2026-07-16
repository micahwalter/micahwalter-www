# Unit of Work Dependencies — Issues #103 / #104

## Sequence (strict)

```text
U1 Photo data plane
  -> U2 Enrichment
    -> U3 Upload UI
      -> U4 Browse & detail
        -> U5 Edit UI
          -> U6 Galleries
            -> U7 Cutover
```

## Dependency matrix

| Unit | Depends on | Blocks | Shared contracts |
|------|------------|--------|------------------|
| U1 | — (tickets, S3, existing auth) | U2–U7 | PhotoRecord schema; GET/PATCH `/photos`; process persist |
| U2 | U1 | Soft: richer U4/U5 tags/map | enrichmentStatus; tags; publicLat/Lon |
| U3 | U1 | U5 (hub), U7 upload path | init metadata: title, caption, featured; multi presign |
| U4 | U1 | U5 shortcut, U6 public, U7 redirects verify | `lib/photos-api.ts`; `/photos/[id]` route; CF redirects |
| U5 | U1, U3, U4 | — | updateMetadata API |
| U6 | U1, U3, U4 | U7 gallery migration verify | GalleryRecord; gallery APIs |
| U7 | U1–U6 | — | Migration idempotency; feed artifact paths; CLI auth |

## Integration checkpoints

| After | Validate |
|-------|----------|
| U1 | API smoke: put/get/list/featured; process write without markdown commit |
| U2 | Enrichment message → tags + fuzzed geo on record |
| U3 | Multi-upload e2e to API |
| U4 | Homepage/`/photos`/detail/search from API; redirect spot-check |
| U5 | Edit persists and shows on public detail |
| U6 | Gallery admin + public page |
| U7 | Migrated ids live; feeds job; CLI; content cleanup dry-run |

## Rollback notes

- **U1–U6**: Redeploy previous Lambda/UI; DynamoDB data may remain (safe). Markdown no longer written — rollback to markdown requires restoring old process code (accepted risk; no dual-write).
- **U7**: Keep migration reversible until content folders deleted; delete markdown only after verification checklist passes.
