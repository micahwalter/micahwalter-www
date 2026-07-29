# Application Design Plan — Issue #127 Exposure

Execute after design questions are answered. Checkboxes update as work completes.

## Design plan checklist

- [x] Resolve design clarification questions (below)
- [x] Generate `issue-127-components.md`
- [x] Generate `issue-127-component-methods.md`
- [x] Generate `issue-127-services.md`
- [x] Generate `issue-127-component-dependency.md`
- [x] Generate consolidating `issue-127-application-design.md`
- [x] Copy/sync canonical filenames if this engagement is active (`components.md`, etc.)
- [x] Validate design completeness against FR-1..FR-8 in `issue-127-requirements.md`

---

## Design clarification questions

### Question 1
Where should the **Exposure public API + DynamoDB table** live?

A) Extend the **photo-upload** stack (`api.micahwalter.com/photos` sibling routes under a new mapping `…/exposures`, or routes on the photos HTTP API)

B) Extend the **newsletter** stack (new table + routes near campaign infra)

C) **New** small CloudFormation stack + HTTP API mapping `api.micahwalter.com/exposures`

D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 2
Where should the **Sunday EventBridge → send orchestrator** Lambda live?

A) New function in the **newsletter** Lambda package (closest to SES dispatch / `AdminEmail` / bus)

B) New function in the **photo-upload** package (closest to photo selection + stamps)

C) New function in a dedicated Exposure package/stack (with Q1=C)

D) Other (please describe after [Answer]: tag below)

[Answer]: B

---

### Question 3
How should production send reach subscribers?

A) Orchestrator builds HTML/text and emits existing **`NewsletterSendRequested`** onto `newsletter-bus` (reuse dispatch Lambda + `newsletter_sends` idempotency)

B) Orchestrator calls SES bulk APIs directly (duplicate dispatch logic)

C) Orchestrator invokes the dispatch Lambda synchronously with the same event shape (skip the bus)

D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 4
Where does the **dedicated Exposure issue counter** live?

A) New DynamoDB item/table in the Exposure/photo stack (simple atomic counter, like a mini tickets counter)

B) Reuse **`post_tickets`** / tickets allocate API (global id space — conflicts with “dedicated counter” decision; only if you reverse that)

C) Counter attribute on a singleton Exposure meta record in the exposures table

D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 5
Public Exposure API base path?

A) `https://api.micahwalter.com/exposures` (API mapping + `GET /` list, `GET /{n}` detail)

B) Nested under photos: `https://api.micahwalter.com/photos/exposures` …

C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 6
Site route slug for the archive?

A) `/exposures` and `/exposures/[n]`

B) `/exposure` and `/exposure/[n]`

C) Other (please describe after [Answer]: tag below)

[Answer]: A
