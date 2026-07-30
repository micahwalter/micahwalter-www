# Issue #127 — Requirement Verification Questions

Periodic photo newsletter (Photosnack-style). Prior decisions are in `issue-127-decisions.md`.

Please answer each question (interactive chat is fine; answers will be recorded here).

---

## Question 1
What should the **lightweight archive** look like on the site?

A) Reuse `type: email` posts under `/emails` (same archive listing as long-form issues; photo snack is just a minimal email post)

B) New post type (e.g. `type: photosnack`) with its own listing route (e.g. `/photosnack` or similar) and detail pages

C) Auto-generated `type: email` archive entry created by the send pipeline (no hand-authored MDX); still listed under `/emails`

D) Other (please describe after [Answer]: tag below)

[Answer]: B — dedicated type + routes; name = **Exposure** (not Photosnack). Route TBD e.g. `/exposures` or `/exposure`; type e.g. `type: exposure`.

---

## Question 2
What text is the “brief explanation” in the email (and archive)?

A) Photo `caption` only (title as subject / heading)

B) Photo `title` only (no separate body text required)

C) Title as heading + caption as body (caption required to mark eligible / to send)

D) Title + caption when present; caption optional (send allowed with title alone)

E) Other (please describe after [Answer]: tag below)

[Answer]: D

---

## Question 3
What is **in scope for the first implementation** (v1)?

**Constraint (already decided):** No CLI send path — EventBridge-driven automation only.

A) Full automated loop in v1: eligibility UI/API + sent tracking + EventBridge schedule (e.g. Sunday) → pick random eligible → build email + archive → dispatch; empty-pool notify

B) Same as A, but ship eligibility + tracking + archive/email builder first behind a **manual EventBridge test event** / one-off invoke, then enable the recurring schedule in a fast follow-up

C) Eligibility + tracking only in v1; EventBridge send/archive deferred

D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 3b
How should the owner trigger a **test email to themselves**? (Must not mark the photo as sent / must not email all subscribers.)

A) Button in the `/upload` edit UI (pick photo → “Send test Exposure”) that calls an authenticated API; delivers to a configured owner address

B) Same as A, but prompt for / use the email address entered in the UI each time

C) Authenticated API only (no UI button in v1); you call it from a tool/browser when needed

D) Emit a special EventBridge test event (e.g. from AWS console) with `testEmail` set — same pattern as newsletter dispatch test mode

E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 4
Where can you mark a photo **eligible** for the Exposure newsletter?

A) Edit UI only (`/upload` edit panel), same pattern as `featured`

B) Upload form + edit UI

C) Edit UI + API only (no upload-time checkbox; patch via edit / authenticated API)

D) Upload form + edit UI + authenticated API patch (no owner CLI)

E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 5
How should we **persist “already sent”** for an Exposure?

A) Fields on the photo record (e.g. `exposureSentAt`, optional campaign/archive id)

B) Separate send-log table/store keyed by photo id (photo stays eligibility-only)

C) Both: stamp the photo and keep a send-log row for history

D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 6
When empty-pool automation notifies you, how should that notification be delivered?

A) Email to a configured owner address (SES) — can reuse the same address as test sends

B) Log only in CloudWatch (you check logs / alarms)

C) CloudWatch alarm / metric that emails via existing AWS alarms

D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 7
Email **subject line** format?

A) Photo title only (e.g. `Surfaces`)

B) Branded prefix + title (e.g. `Exposure · Surfaces` or `Micah Walter · Surfaces`)

C) Fixed series name + date (e.g. `Exposure — 2026-07-28`)

D) Other (please describe after [Answer]: tag below)

[Answer]: B + issue number — branded prefix + title, and include a sequential Exposure issue number (exact subject pattern confirmed in Q7b).

---

## Question 7b
What should the **subject line** look like with the issue number?

A) `Exposure #42 · Surfaces` (series + issue number + title)

B) `Exposure · Surfaces (#42)` (title first, number in parentheses)

C) `#42 · Surfaces` (number + title only; series implied)

D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 7c
What is the **issue number**?

A) A dedicated sequential Exposure counter (1, 2, 3… independent of blog/photo/email ticket ids)

B) Reuse the global post ticket `id` allocated when the Exposure archive entry is created (same counter as other posts)

C) Use the photo’s existing `id`

D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 8 — Security Extensions
Should security extension rules be enforced for this project?

A) Yes — enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)

B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 9 — Resiliency Extensions
Should the resiliency baseline be applied to this project?

A) Yes — apply the resiliency baseline as directional best practices and design-time guidance

B) No — skip the resiliency baseline (suitable for PoCs / rapid iteration)

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 10 — Property-Based Testing Extension
Should property-based testing (PBT) rules be enforced for this project?

A) Yes — enforce all PBT rules as blocking constraints

B) Partial — enforce PBT rules only for pure functions and serialization round-trips

C) No — skip all PBT rules

X) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Follow-up Question 11
When should the **Sunday EventBridge schedule** fire? (Timezone matters for “Sunday”.)

A) Sunday 09:00 America/New_York

B) Sunday 12:00 America/New_York (noon)

C) Sunday 09:00 UTC

D) Other (please describe day/time/timezone after [Answer]: tag below)

[Answer]: A

---

## Follow-up Question 12
How should **Exposure archive** pages be stored/served? (Site is mostly static export; photos are increasingly API/DynamoDB-backed.)

A) DynamoDB + API (like photos) — `/exposures` and `/exposures/[n]` fetch at runtime (or build-time from API)

B) Commit a content file to git via GitHub API on each send (like the old photo-upload commit path) — static pages from content

C) No durable content file — generate email HTML only; archive pages are thin wrappers that load photo `id` + Exposure metadata from the photo record / a small exposures table

D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Follow-up Question 13
Where is the **owner email** configured (test sends + empty-pool notify)?

**How the long-form newsletter does it today:**
- **Test sends:** You pass the address each time (`blog email:send <slug> --test you@example.com`). That becomes `testEmail` on the EventBridge event. **Nothing stores an “owner email”** for tests.
- **From address:** CloudFormation parameter `SenderEmail` (default `micah@micahwalter.com`) → Lambda env — SES **From**, not a notify-to.
- **Admin notify:** CloudFormation parameter `AdminEmail` (default `micah@micahwalter.com`) → `ADMIN_EMAIL` env — used when a **new subscriber confirms**. Closest existing “email me” pattern.
- **Secrets Manager (newsletter):** HMAC signing keys only, not email addresses.

Exposure needs a stored owner address because the edit-UI test button and empty-pool notify can’t take a CLI `--test` flag. This is **new wiring**, but we can mirror `AdminEmail`.

A) Reuse newsletter `AdminEmail` / `ADMIN_EMAIL` for Exposure test + empty-pool notify (same address you already get subscriber-confirm mail on)

B) New CloudFormation parameter (e.g. `ExposureOwnerEmail`) + Lambda env — same style as `AdminEmail`, separate so you can diverge later

C) Secrets Manager field — changeable without a stack redeploy

D) Other (please describe after [Answer]: tag below)

[Answer]: A
