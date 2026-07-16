# U1 — NFR Requirements

**Unit**: Photo data plane  
**Decisions from**: `u1-photo-data-plane-nfr-requirements-plan.md`

---

## Scalability

| ID | Requirement |
|----|-------------|
| NFR-U1-S1 | Design for **personal / low traffic**: tens of uploads/day, low thousands of reads/day. |
| NFR-U1-S2 | On-demand DynamoDB and Lambda concurrency defaults are sufficient; no provisioned autoscaling complexity in U1. |
| NFR-U1-S3 | Multi-region scale-out is **out of scope for U1** (see U7 / NFR-3). |

## Performance

| ID | Requirement |
|----|-------------|
| NFR-U1-P1 | **Best effort** latency — no hard SLO. Soft goal: warm p95 GET list/get/featured under ~500ms. |
| NFR-U1-P2 | Cold starts documented as acceptable; no provisioned concurrency required in U1. |
| NFR-U1-P3 | Default list `limit=12`, maximum `limit=50` (cursor pagination per functional design). |

## Caching

| ID | Requirement |
|----|-------------|
| NFR-U1-C1 | **No CDN/API response caching** in U1 — API Gateway → Lambda → DynamoDB direct. |
| NFR-U1-C2 | Future Cache-Control / CloudFront for GETs may be added in a later unit if needed. |

## Availability

| ID | Requirement |
|----|-------------|
| NFR-U1-A1 | Deploy in **us-east-1** primary, matching current `micahwalter-photo-upload` posture. |
| NFR-U1-A2 | No DynamoDB global tables in U1. |
| NFR-U1-A3 | Process path: fail closed on optimize/ticket errors (no partial rows) — availability of “correctness” over partial publish. |

## Security

| ID | Requirement |
|----|-------------|
| NFR-U1-SEC1 | Public GET endpoints are unauthenticated. |
| NFR-U1-SEC2 | Owner PATCH requires existing photo-upload **HMAC** token. |
| NFR-U1-SEC3 | Process Lambda uses **IAM** role only for DynamoDB/S3/tickets. |
| NFR-U1-SEC4 | Public DTOs must not expose precise GPS (fields null until U2; never leak precise coords). |
| NFR-U1-SEC5 | Secrets remain in Secrets Manager (`photo-upload-secrets`); not in git or logs. |
| NFR-U1-SEC6 | No additional API Gateway rate limiting required in U1 (can revisit later). |

## Reliability & observability

| ID | Requirement |
|----|-------------|
| NFR-U1-R1 | CloudWatch logs for new/updated Lambdas; rely on API Gateway and Lambda basic metrics (4xx/5xx). |
| NFR-U1-R2 | No new SNS alarms required in U1. |
| NFR-U1-R3 | Process and API errors logged with enough context to debug (message + key ids when available). |

## Maintainability

| ID | Requirement |
|----|-------------|
| NFR-U1-M1 | Extend existing photo-upload Lambda package layout and CFN stack rather than a parallel stack. |
| NFR-U1-M2 | Keep HTTP contracts simple JSON suitable for `lib/photos-api.ts` in U4. |

## Usability (API consumer)

| ID | Requirement |
|----|-------------|
| NFR-U1-U1 | Predictable cursor pagination and featured semantics matching site behavior. |
| NFR-U1-U2 | CORS continues to allow production www and local dev origins as today. |
