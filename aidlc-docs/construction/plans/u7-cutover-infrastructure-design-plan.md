# U7 — Cutover — Infrastructure Design Plan

**Inputs**: FD + NFR Design (approved)  
**Next after approval**: Code Generation  

---

## Plan checklist

- [x] Collect answers (derived from NFR Design + tickets-secondary / photo-upload / www)
- [x] Resolve ambiguities
- [x] Generate infrastructure-design + deployment-architecture
- [x] Present Infrastructure Design completion (Continue → Code Generation)

---

## Locked answers (derived — no re-ask)

| Category | Lock | Source |
|----------|------|--------|
| Cloud | AWS only; extend existing stacks | Peer stacks |
| Primary region | us-east-1 | U1–U6 |
| Secondary | us-east-2 photo-upload-secondary + api-domain-secondary mapping | tickets pattern |
| DDB | Keep tables in us-east-1; secondary Lambdas use primary table ARNs | tickets-secondary |
| Secrets | Add ReplicaRegions us-east-2 on photo-upload-secrets | ticket-server-secrets |
| Feed job | EventBridge schedule → Lambda in us-east-1; write artifacts to website/images-accessible location | FR-9 |
| Migrator/cleanup | `scripts/` Node; dry-run / `--apply`; operator with `www` profile | U6 pattern |
| CLI | Extend `blog photos:import` / `photos:tag` → API | FR-10 |
| Process | Confirm no GitHub commit; drop dead github commit path / secret field if unused | FR-11 |
| Monitoring | CloudWatch logs only; no new SNS | NFR-U7-O2 |
| Shared infra | Reuse api-domain primary/secondary; newsletter artifacts buckets | Existing |
