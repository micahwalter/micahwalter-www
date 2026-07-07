# Issue #90 — Clarification Questions

Your answers to Q1 and Q4 appear contradictory. Please resolve before we finalize requirements.

## Contradiction: Micro page scope

- **Q1 (scope):** **B** — Phase 1 + reduce `/micro/[id]` static pages
- **Q4 (micro pages):** **A** — Keep per-toot pages; defer micro optimization

These cannot both apply in the same engagement.

### Clarification Question 1

For **this branch**, what is the correct scope for `/micro/[id]`?

A) **Defer micro optimization** — implement Phase 1 only (redirects + CI cache + metrics); keep all 427 `/micro/[id]` pages for now

B) **Include micro optimization** — reduce `/micro/[id]` static generation (listing-only or paginated) as part of this branch

C) Other (please describe after [Answer]: tag below)

[Answer]: A
