# U7 — Cutover — NFR Requirements Plan

**Inputs**: `u7-cutover/functional-design/` (approved)  
**Next after approval**: NFR Design  

---

## Plan checklist

- [x] Collect answers (derived from Requirements / FD / tickets+images posture)
- [x] Resolve ambiguities
- [x] Generate NFR artifacts
- [x] Present NFR Requirements completion (Continue → NFR Design)

---

## Locked answers (derived — no re-ask)

| Q | Answer | Source |
|---|--------|--------|
| 1 | Multi-region **in U7** — primary us-east-1 + secondary us-east-2 parity with tickets/images | NFR-3, US-016, Req Q13–15 |
| 2 | DynamoDB stays primary us-east-1; secondary Lambdas use cross-region table ARNs (tickets pattern) | `tickets-secondary.yml` |
| 3 | Secondary API/Lambda stack + api-domain failover like newsletter/tickets-secondary | Existing secondary stacks |
| 2b | Secrets Manager ReplicaRegions us-east-2 | `ticket-server-secrets` |
| 4 | Feed job: **primary region** schedule; best-effort; no full site rebuild | FR-9, US-015 |
| 5 | Migration/cleanup: operator laptop + dry-run; personal scale (~44 photos) | FD, US-013 |
| 6 | Perf: best-effort; no hard SLO; no API CDN cache | U1/U4/U6 |
| 7 | Observability: CloudWatch logs; no new SNS alarms required in U7 | U1/U6 |
| 8 | Security: existing HMAC; no Security extension | Extensions off |
| 9 | CLI auth: reuse tickets/photo passcode patterns | FR-10, tickets CLI |
| 10 | Content cleanup: git PR after verify; build must stay green | US-014 |
