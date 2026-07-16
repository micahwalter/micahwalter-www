# Issue #103 / #104 — Unit of Work Plan

**Purpose**: Decompose the photo metadata migration into ordered units of work for Construction.  
**Inputs**: Requirements, stories US-001–016, application design, execution plan tentative sequence  

Please answer every `[Answer]:` below. After validation and **plan approval**, artifacts will be generated:

- `aidlc-docs/inception/application-design/unit-of-work.md`
- `aidlc-docs/inception/application-design/unit-of-work-dependency.md`
- `aidlc-docs/inception/application-design/unit-of-work-story-map.md`

---

## Proposed units (baseline from execution plan)


| Unit | Name             | Focus                                                                                           | Stories (indicative) |
| ---- | ---------------- | ----------------------------------------------------------------------------------------------- | -------------------- |
| U1   | Photo data plane | DynamoDB photos, public read + auth write APIs, process writes DB (no GitHub commit)            | US-002 foundation    |
| U2   | Enrichment       | Async queue, GPS fuzz, AWS Location city/country tags, Bedrock tags                             | US-003, US-004       |
| U3   | Upload UI        | Multi-file `/upload` with per-file title/caption/featured + progress                            | US-001               |
| U4   | Browse & detail  | `lib/photos-api.ts`, homepage/`/photos`/`/photos/[id]`, static map port, live search, redirects | US-007–010           |
| U5   | Edit UI          | Hub editor + `/photos/[id]` Edit shortcut                                                       | US-005               |
| U6   | Galleries        | DynamoDB galleries, hub admin, public galleries, migrate gallery markdown                       | US-011, US-012       |
| U7   | Cutover          | Migrate 43 photos, stop markdown, content cleanup, feed job, CLI parity, multi-region           | US-006, US-013–016   |


**Critical path (locked)**: U1 → U2 → U3 → U4 → U5 → U6 → U7 (**strict sequential**; no parallel overlap)

---

## Decisions locked

| Q | Choice | Meaning |
|---|--------|---------|
| 1 | A | Keep 7-unit baseline |
| 2 | A | Strict sequential unit completion |
| 3 | A | No dual-write — DynamoDB only from U1 |
| 4 | A | Single owner / approver for all units |
| 5 | A | Each unit deployable/demoable when finished |
| 6 | A | Journey-aligned unit boundaries |

---

## Planning questions (answered)



### Question 1 — Story grouping / unit count

A) **Accept the 7-unit baseline above**

B) **Merge UI units** — Combine U3+U5 (all admin UI) and keep U4 public UI separate → 6 units

C) **Merge enrichment into data plane** — U1 includes async enrichment (U2 removed) → 6 units

D) **Fewer, larger units** — (1) Backend data+enrichment+process, (2) All frontend, (3) Cutover+feeds+CLI → 3 units

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



### Question 2 — Dependencies / sequencing

A) **Strict sequential** — Finish each unit (design+code+smoke) before starting the next on the critical path

B) **Pipeline with limited overlap** — After U1 APIs exist, allow U3 and U4 in parallel; U2 can overlap late U1 if contracts stable

C) **Max parallel after U1** — Once read/write APIs land, run U2–U6 in parallel where possible; U7 last only

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



### Question 3 — Dual-write during U1

A) **No dual-write** — Process writes DynamoDB only from the start of U1 (faster; harder rollback to markdown)

B) **Short dual-write** — Process writes DynamoDB + still commits markdown until U7 cutover flag flips

C) **Feature flag** — Env/flag chooses DB-only vs dual-write; default dual-write until U7

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



### Question 4 — Team / ownership (solo site)

A) **Single owner for all units** — You review/approve each unit; no split ownership (default for this repo)

B) **Logical ownership labels only** — Tag units Backend / Frontend / Cutover for doc clarity; still one implementer

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



### Question 5 — Deployability per unit

A) **Each unit should be deployable/demoable** — e.g. U1 APIs live before UI; U4 can show API data even if upload UI unfinished

B) **Backend units ship together** — U1+U2 before any frontend depends on enrichment fields

C) **Hold public cutover to U7** — Earlier units can deploy to AWS, but www keeps markdown photos until U7

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



### Question 6 — Business domain boundaries

A) **Align units to journeys** — Keep upload/enrich vs browse vs admin vs galleries vs cutover as separate units (matches baseline)

B) **Align to bounded contexts only** — (1) Photo catalog, (2) Authoring, (3) Distribution/feeds — remap stories accordingly

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



## Generation checklist (after plan approval)

- [x] Generate `unit-of-work.md` with unit definitions and responsibilities
- [x] Generate `unit-of-work-dependency.md` with dependency matrix and sequence
- [x] Generate `unit-of-work-story-map.md` mapping US-001–016 to units (100% coverage)
- [x] Validate unit boundaries vs application design components
- [x] Ensure all stories are assigned
- [x] Update `aidlc-state.md` and `audit.md`

---

When all answers are filled, reply in chat.