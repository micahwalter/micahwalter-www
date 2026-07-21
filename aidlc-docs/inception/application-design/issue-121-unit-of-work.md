# Units of Work — Issue #121 (lightweight)

Engagement chose a thin decomposition: sequencing labels only, no user stories, no further planning Q&A.

| Unit | Name | Scope | Construction depth |
|------|------|-------|-------------------|
| **U1** | Tickets machine allocate | `tickets-allocate` Go Lambda; `POST /allocate` with `AWS_IAM`; primary + secondary CFN; Makefile zip | Code-first (infra in CFN); brief notes only |
| **U2** | PR allocate bot + IAM | GHA workflow; frontmatter patch script; `execute-api:Invoke` on Actions role | Code-first |
| **U3** | Docs + backfill | Conventions docs; id for Photos without the deploy | Code Gen only |

**Order**: U1 → U2 → U3

**Skipped**: Formal User Stories; full Units Generation ceremony; per-unit Functional/NFR/Infrastructure Design approval gates (requirements + application design are sufficient).
