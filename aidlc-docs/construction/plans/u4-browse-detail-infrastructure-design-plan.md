# U4 — Browse & detail — Infrastructure Design Plan

**Inputs**: FD + NFR Requirements + NFR Design (approved)  
**Next after approval**: Code Generation  

---

## Plan checklist

- [x] Collect answers (derived from prior locks — no re-ask)
- [x] Resolve ambiguities
- [x] Generate `infrastructure-design.md`
- [x] Generate `deployment-architecture.md`
- [x] Present Infrastructure Design completion (Continue → Code Generation)

---

## Category locks (mandatory categories)

| Category | Status | Decision |
|----------|--------|----------|
| Deployment Environment | Locked | AWS; static site via existing `deploy.yml`; CF via `infra/infra.yml` + `infra-deploy.yml` |
| Compute | Locked / N/A new | No new Lambdas; browse uses static S3/CloudFront + existing photos-api |
| Storage | Locked / N/A new | No new tables/buckets; read existing photo API / image CDN |
| Messaging | N/A | No queues/events in U4 browse path |
| Networking | Locked | Extend `StaticHTMLRoutingFunction`; photo API CORS unchanged |
| Monitoring | Locked | No new alarms (NFR-U4-O2) |
| Shared Infrastructure | Locked | `micahwalter-www` CloudFront + `NEXT_PUBLIC_PHOTO_API_URL` |

### Derived defaults (implementation detail)

| Topic | Choice |
|-------|--------|
| Redirect rule | `/posts/<digits>` → 301 `/photos/<digits>` early in Function |
| Static map host | OSM-style staticmap URL (e.g. `staticmap.openstreetmap.de`); hide on error |
| Local/dev redirects | Optional Next.js fallback for numeric `/posts/<id>` when CF absent (issue-90 pattern) |
| Env | Reuse `NEXT_PUBLIC_PHOTO_API_URL`, `NEXT_PUBLIC_CDN_URL` |

---
