# Unit Dependencies — Issue #121

| Unit | Depends on | Why |
|------|------------|-----|
| U1 | Existing `post_tickets` + tickets HTTP API | Extends stack |
| U2 | U1 deployed (allocate URL + IAM route live) | Workflow calls allocate |
| U3 | U1 (and ideally U2 path proven) | Backfill uses machine allocate |

```
U1 (allocate API) --> U2 (PR bot + IAM) --> U3 (docs + backfill)
```
