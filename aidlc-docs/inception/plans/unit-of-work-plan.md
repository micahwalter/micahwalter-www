# Unit of Work Plan — Issue #127 Exposure

Part 1: answer questions below. Part 2: generate unit artifacts after plan approval.

## Generation checklist (after approval)

- [x] Generate `issue-127-unit-of-work.md`
- [x] Generate `issue-127-unit-of-work-dependency.md`
- [x] Generate `issue-127-unit-of-work-story-map.md` (FR → unit map; User Stories were skipped)
- [x] Sync canonical `unit-of-work*.md` for this engagement
- [x] Validate unit boundaries and deploy order
- [x] Ensure FR-1..FR-8 are each assigned to a unit

---

## Proposed split (from execution plan)

| Unit | Focus | Components |
|------|--------|------------|
| **U1** | Eligibility + owner test send | C1 fields, C2/C3 edit+test, AdminEmail for test |
| **U2** | Exposure archive API + site | C4 store, C5 counter (create only?), C6 API, C7 site |
| **U3** | Sunday orchestrator + production dispatch | C8 orchestrator, C5 allocate, C9 bus emit, C10 empty-pool, photo stamp |

---

## Clarification questions

### Question 1
Is the **three-unit** split above right?

A) Yes — U1 eligibility/test → U2 archive/site → U3 schedule/send

B) Merge U1+U2 (photo stack data + UI together), keep U3 send separate

C) Merge U2+U3 (archive + send together), keep U1 eligibility/test first

D) Single unit (all Exposure work in one construction loop)

E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 2
Where should the **Exposure counter** (C5) land?

A) **U2** creates the counter resource; **U3** is the only writer that allocates on send (U2 may read for display)

B) **U3** owns create + allocate (U2 archive rows receive `N` from orchestrator only)

C) **U1** creates it early; U3 allocates

D) Other (please describe after [Answer]: tag below)

[Answer]: B

---

### Question 3
**AdminEmail** wiring into the photo-upload stack?

A) Add CFN parameter on photo-upload stack (default `micah@micahwalter.com`, document must match newsletter `AdminEmail`) — usable by U1 test and U3 empty-pool

B) U1/U3 read newsletter stack export / SSM parameter for AdminEmail (single source of truth)

C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 4
Construction **design depth** per unit?

A) Full per-unit Functional + NFR + Infrastructure Design before code (as in execution plan)

B) Lightweight: one combined design note per unit, then Code Generation (faster; still document infra changes)

C) Code-first after Units Generation (minimal design docs; match some prior engagements)

D) Other (please describe after [Answer]: tag below)

[Answer]: B


---

## Answers summary

| Q | Choice | Decision |
|---|--------|----------|
| 1 | A | Three units: U1 eligibility/test → U2 archive/site → U3 schedule/send |
| 2 | B | U3 owns counter create + allocate |
| 3 | A | AdminEmail CFN param on photo-upload stack |
| 4 | B | Lightweight combined design note per unit, then Code Generation |
