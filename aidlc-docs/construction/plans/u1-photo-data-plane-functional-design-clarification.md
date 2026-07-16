# U1 Functional Design — Clarification

## Ambiguity — Q8 Auth for writes

You chose **A**. Option A’s wording mixed “HMAC token” and “IAM” for the process path.

In practice for this architecture:

- **Process Lambda** is triggered by S3 and should call DynamoDB with its **IAM role** (no browser token).
- **Browser PATCH** (and future admin UI) should use the existing **passcode → HMAC token** (same as `/upload`).

### Clarification Question 1

Confirm write auth for U1:

A) **Process = IAM only; browser PATCH = HMAC token** (recommended; matches how upload already works)

B) **Every write including process must present HMAC** (unusual for S3-triggered Lambda — not recommended)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

**Already locked from your answers**

| Q | Choice |
|---|--------|
| 1 | id PK + publishedAt + createdAt/updatedAt |
| 2 | pending enrichment, already publicly listable |
| 3 | title from filename; caption “Photo taken with {camera}” or empty |
| 4 | publishedAt desc, id desc; cursor pagination |
| 5 | newest featured, else newest overall |
| 6 | draft supported; public omits drafts |
| 7 | no DynamoDB write if optimize/ticket fails |
