# U6 — Deployment Architecture

## Runtime topology

```text
Admin browser (/upload Galleries tab)
  -> sessionStorage HMAC token
  -> POST/PATCH https://api.micahwalter.com/photos/galleries...
       -> API Gateway HTTP API (mapping key photos)
       -> photo-upload-photos-api Lambda
       -> DynamoDB micahwalter-galleries

Visitor /galleries, /galleries/<slug>
  -> CloudFront www -> S3 static shell
  -> client fetch GET .../galleries[/slug]
  -> parallel GET .../photos/{id} for membership
  -> tiles link to /photos/<id>

Migrator (ops)
  content/galleries/*/index.md
  -> script dry-run | --apply
  -> DynamoDB upsert by slug
```

### Text alternative

1. Owner unlocks hub and opens Galleries tab.  
2. Create/update gallery metadata and ordered photo ids via authenticated API.  
3. Visitors load static gallery pages; client fetches gallery JSON then photo metadata.  
4. Missing photo ids are skipped.  
5. One-time migrator upserts existing markdown galleries.

---

## Deploy pipeline

| Step | Mechanism |
|------|-----------|
| 1 | Update `infra/photo-upload.yml` (table, routes, IAM, env) |
| 2 | Build/upload lambda zip; deploy stack (`photo-upload-deploy.yml`) |
| 3 | Deploy site UI (`deploy.yml`) |
| 4 | Run migrate script dry-run, then `--apply` |
| 5 | Optional: CF Function shell rewrite if using placeholder gallery slugs |

**Order**: API/table before site UI that depends on gallery endpoints; migration after table exists.

---

## Environments

| Env | Notes |
|-----|-------|
| Production | us-east-1 stack + www |
| Local | Point `NEXT_PUBLIC_PHOTO_API_URL` at prod/API; migrator needs AWS creds |

## Rollback

1. Redeploy prior lambda/template (routes/table remain unless stack delete).  
2. Site rollback via prior static deploy.  
3. Table data retained (PITR enabled).  
4. Markdown gallery files still in git until U7 cleanup.

## Verification checklist

- [ ] `GET /photos/galleries` returns non-draft list  
- [ ] `GET /photos/galleries/{slug}` works; draft hidden publicly  
- [ ] Authenticated POST/PATCH succeed; unauthenticated mutate → 401  
- [ ] `GET /photos/galleries` does **not** hit photo-by-id handler  
- [ ] Hub Galleries tab CRUD/membership  
- [ ] Public `/galleries` + detail render API photos → `/photos/<id>`  
- [ ] Migrator dry-run + apply for `recent` and `street-and-city`  
