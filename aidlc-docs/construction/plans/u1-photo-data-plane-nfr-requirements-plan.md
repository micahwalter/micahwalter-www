# U1 — Photo data plane — NFR Requirements Plan

**Unit**: U1 Photo data plane  
**Context**: Personal site API; DynamoDB photos; Node Lambdas on existing photo-upload stack  

Please answer every `[Answer]:` below.

---

## Questions

### Question 1 — Expected load / scalability

A) **Personal / low traffic** — Design for tens of uploads/day and low thousands of reads/day; single-region primary sufficient for U1 (multi-region in U7)

B) **Burst-friendly personal** — Same baseline traffic but size Lambdas/API for occasional spikes (e.g. homepage traffic after a post)

C) **Provision for growth now** — Higher read capacity / caching assumptions beyond current personal traffic

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



### Question 2 — API latency targets (public GET)

A) **Best effort** — No hard SLO; p95 under ~500ms when warm is a soft goal

B) **Soft SLO** — p95 < 300ms for get/list when warm; document cold-start separately

C) **Strict** — p95 < 200ms get; add CloudFront/API caching in U1

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



### Question 3 — Caching for public reads in U1

A) **No CDN cache on API in U1** — Direct API Gateway → Lambda → DynamoDB; add caching in later unit if needed

B) **Short Cache-Control on GET** — e.g. 30–60s public cache headers for list/get/featured

C) **CloudFront in front of photo API GETs** — more infra in U1

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



### Question 4 — Availability for U1

A) **Match current photo-upload stack** — us-east-1 primary; no new multi-region in U1 (U7 handles parity)

B) **DynamoDB global tables from U1** — start multi-region data plane immediately

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



### Question 5 — Security baseline for U1 (practical NFRs)

A) **Confirm defaults** — Public GET open; PATCH HMAC; process IAM; no precise GPS in public DTO; secrets in Secrets Manager only

B) **Add rate limiting** — API Gateway throttle/burst limits on public GET and auth endpoints in U1

C) **A + B**

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



### Question 6 — Observability

A) **CloudWatch logs + basic metrics** — Lambda logs; API 4xx/5xx; DynamoDB errors (match existing stacks)

B) **A + structured log fields** — photo id, enrichmentStatus, latency on each request

C) **A + B + alarms** — e.g. 5xx rate / process failures SNS in U1

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



### Question 7 — Tech stack confirmation for U1

A) **Confirm locked stack** — Node.js Lambdas, API Gateway HTTP API on existing photo-upload stack, DynamoDB, AWS SDK v3, existing HMAC auth lib patterns

B) **Same as A but new DynamoDB table name/prefix preference** (describe under Other if needed — use X)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



### Question 8 — Pagination page size defaults

A) **Default limit 12** (match current `/photos` page size), max 50

B) **Default limit 24**, max 100

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



## Generation checklist (after answers)

- [ ] `nfr-requirements.md`
- [ ] `tech-stack-decisions.md`
- [ ] Update state/audit

---

When done, reply in chat.