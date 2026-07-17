# U6 — NFR Design Patterns

**Decisions**: Derived from U6 NFR Requirements + U1/U4 patterns (no re-ask)

---

## Resilience

### Manual Retry + skip-missing membership
- Public/admin gallery fetches: on failure show message + **Retry** (no auto multi-retry loops).
- When resolving `photoIds`, **skip** 404/missing photos; still render the gallery.
- No fallback to `content/galleries` markdown after API wiring.
- Migration upsert is idempotent by slug; dry-run available; failures are re-runnable.

## Scalability

### On-demand serverless
- DynamoDB galleries table **on-demand**.
- Gallery routes on existing photos-api Lambda — **default concurrency**.
- Expected volume: handful of galleries; membership tens of ids — no pagination complexity required for list.

## Performance

### Bounded parallel resolve
- Resolve membership with concurrency **3–5** parallel `GET /{id}` (client or server aggregator).
- No batch GetItem API in U6.
- No CDN/API response cache; no shared React cache layer.

## Security

### Auth gate + public projection
- Mutations: HMAC token verify (reuse AuthVerifier).
- Public reads: non-draft only; never require token.
- IAM: least privilege on `micahwalter-galleries` for the API role.
- No delete endpoint/UI.

## Cross-cutting

| Pattern | Applied |
|---------|---------|
| Client islands | Public `/galleries` pages fetch API |
| Hub tab | Galleries alongside Upload/Edit with shared sessionStorage token |
| CQRS-lite | Admin writes vs public read DTOs |
| Static export shell | Placeholder params + CF URI rewrite if needed (U4 pattern) |

---

## Explicitly not applied

| Pattern | Reason |
|---------|--------|
| Auto-retry / circuit breaker | Personal traffic |
| API Gateway caching | NFR-U6-C1 |
| Dedicated galleries Lambda | Same zip/routes |
| Soft-delete / hard-delete | FD Q6=A |
