# Unit Dependencies — Issue #127 Exposure

## Dependency matrix

| Unit | Depends on | Dependency type |
|------|------------|-----------------|
| U1 | Existing photo API/auth/edit UI | Baseline |
| U1 | Newsletter bus or SES for test | Runtime (testEmail path) |
| U2 | Existing photo CDN URLs / photo get for display fields | Soft (denormalize on write from U3) |
| U2 | U1 fields optional | None hard — archive independent of eligibility UI |
| U3 | U1 photo fields + candidate query | Hard (eligibility + unsent) |
| U3 | U2 exposures store (create) + public URL shape | Hard |
| U3 | Newsletter bus + dispatch | Hard |
| U3 | AdminEmail param (introduced in U1) | Hard |

## Deploy / build order

```text
1. U1 — schema + eligibility UI + test send + AdminEmail param
2. U2 — exposures table + public API + /exposures pages
3. U3 — counter + EventBridge orchestrator + IAM to newsletter-bus
```

U2 can start after U1 schema exists but does not require U1 UI. Prefer **sequential** completion for clearer testing: U1 testable alone → U2 readable with seed/manual row → U3 end-to-end.

## Parallelization

| Pair | Parallel? | Notes |
|------|-----------|-------|
| U1 \|\| U2 | Limited | U2 table/API can proceed while U1 UI finishes if schema agreed |
| U2 \|\| U3 | No | U3 writes archive via U2 store |
| U1 \|\| U3 | No | U3 needs eligibility fields + AdminEmail |

## Integration checkpoints

1. After U1: PATCH eligibility; test email arrives at AdminEmail only
2. After U2: `GET /exposures` and site pages work (empty list OK)
3. After U3: manual EventBridge invoke with inventory; empty-pool notify; production path stamps photo and lists under `/exposures/N`
