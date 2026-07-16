# U3 — Business Logic Model (light)

**Story**: US-001 — Multi-file upload with per-file metadata

## Primary workflow

```text
Owner opens /upload
  -> enter passcode -> POST /photos/auth -> token
  -> select up to 20 JPEG/PNG files
  -> edit per-file title (prefilled), caption, featured
  -> start upload
  -> for each file (concurrency 3):
       POST /photos/upload-url (title, caption, featured)
       PUT file to S3 with signed headers
       mark row done | error
  -> stay on page; optional clear done rows
```

## Out of scope

- Enrichment visibility (U2 async)  
- Browse/detail (U4)  
- Edit/gallery hub (U5/U6)  
- New backend routes (init already supports caption)  
