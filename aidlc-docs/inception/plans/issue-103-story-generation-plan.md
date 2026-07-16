# Issue #103 / #104 — Story Generation Plan

**Purpose**: Convert approved requirements into INVEST user stories and personas.  
**Requirements**: `aidlc-docs/inception/requirements/issue-103-requirements.md`  
**Assessment**: `aidlc-docs/inception/plans/issue-103-user-stories-assessment.md`

Please answer every `[Answer]:` below. When done, reply here (e.g. “done”). After answers are validated (and any clarifications resolved), you will be asked to **approve this plan** before stories are generated.

---

## Part 1 — Planning questions

### Question 1 — Personas to model

A) **Two personas** — Site Owner (upload/edit/admin) and Visitor (browse/detail)

B) **Three personas** — Site Owner, Visitor, and “Returning Visitor with bookmarked `/posts/<id>` links” (legacy URL / redirect focus)

C) **Owner only** — Stories focus on authoring; visitor behavior covered only as acceptance criteria on owner-facing epics

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



### Question 2 — Story breakdown approach

A) **Epic-based** — Epics (Upload & Enrichment, Browse & Detail, Edit & Admin, Galleries, Cutover & Feeds) with small stories under each

B) **User journey-based** — Stories ordered as journeys: “Publish a batch”, “Fix metadata”, “Visitor finds a photo”, “Build a gallery”, “Cut over from markdown”

C) **Feature-based** — Flat list grouped by feature area without formal epics

D) **Hybrid** — Epics for structure + one primary journey narrative per epic in the story description

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---



### Question 3 — Story granularity

A) **Small / vertical** — Prefer stories that can be demoed end-to-end where possible (e.g. “upload one photo to DB and see it on `/photos`”) even if infrastructure is shared

B) **Layered** — Separate backend/API stories from UI stories (faster parallel units; weaker solo demos)

C) **Coarse** — Fewer, larger stories (one per epic) with detailed acceptance criteria

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



### Question 4 — Acceptance criteria style

A) **Checklist** — Bullet “Given/When/Then or checkboxes” per story (repo’s prior AI-DLC style)

B) **Gherkin** — Formal Given/When/Then scenarios only

C) **Checklist + happy path Gherkin** — Bullets for edge cases; one Gherkin scenario for the happy path

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



### Question 5 — Cutover / migration stories

A) **Include explicit cutover stories** — Migration of 43 photos, stop GitHub commits, delete markdown folders, redirects, dual-write end — as first-class stories

B) **Fold into technical epics** — Mention cutover only inside related feature stories’ acceptance criteria

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



### Question 6 — Story ID / tracing

A) **US-### with FR mapping** — e.g. `US-012` maps to `FR-2`, `NFR-1` in each story

B) **US-### only** — Traceability via epic tags; no per-FR lines

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



## Decisions (locked from answers)

| Q | Choice | Meaning |
|---|--------|---------|
| 1 | A | Personas: Site Owner + Visitor |
| 2 | B | Journey-based story organization |
| 3 | A | Small / vertical (demoable) stories |
| 4 | A | Checklist acceptance criteria |
| 5 | A | Explicit cutover/migration stories |
| 6 | A | `US-###` with FR/NFR mapping per story |

---

## Part 2 — Generation checklist (execute only after plan approval)

- [x] Generate `aidlc-docs/inception/user-stories/issue-103-personas.md` with approved personas
- [x] Generate `aidlc-docs/inception/user-stories/issue-103-stories.md` using approved breakdown, granularity, and AC style
- [x] Ensure each story follows INVEST and includes acceptance criteria
- [x] Map personas to stories
- [x] Cross-check coverage against FR-1…FR-11 and key NFRs in `issue-103-requirements.md`
- [x] Update `aidlc-docs/aidlc-state.md` and `audit.md`

---



## Approach trade-offs (reference)


| Approach      | Pros                            | Cons                          |
| ------------- | ------------------------------- | ----------------------------- |
| Epic-based    | Clear delivery slices for units | Can feel “system-centric”     |
| Journey-based | Strong UAT narrative            | Harder to split infra work    |
| Feature-based | Simple list                     | Weak sequencing for cutover   |
| Hybrid        | Structure + narrative           | Slightly more doc to maintain |


---

When all answers are filled, reply in chat. Do **not** expect story files until this plan is approved after answer validation.