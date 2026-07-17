# U6 — Galleries — Infrastructure Design Plan

**Inputs**: FD + NFR Requirements + NFR Design (approved / derived)  
**Next after approval**: Code Generation  

---

## Plan checklist

- [x] Collect answers (derived — no re-ask)
- [x] Resolve ambiguities
- [x] Generate `infrastructure-design.md`
- [x] Generate `deployment-architecture.md`
- [x] Present Infrastructure Design completion (Continue → Code Generation)

---

## Category locks

| Category | Decision |
|----------|----------|
| Deployment | AWS us-east-1; extend `micahwalter-photo-upload` |
| Compute | Existing `photo-upload-photos-api` Lambda (no new function) |
| Storage | New DynamoDB table `micahwalter-galleries`, PK=`slug`, PAY_PER_REQUEST |
| Messaging | N/A |
| Networking | New HTTP API routes under ApiMappingKey `photos` — **before** `GET /{id}` |
| Monitoring | Logs only |
| Shared | Existing secret/HMAC; site deploy via `deploy.yml`; photo-upload-deploy for API |

---
