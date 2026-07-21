# Issue #121 — Requirement Verification Questions

Please answer each question by filling in the letter after `[Answer]:`. Choose **Other** and describe if none of the options fit.

Context: We are implementing **Option 2** (machine-callable allocate path) and **Option 3** (PR bot allocates before merge) from [#121](https://github.com/micahwalter/micahwalter-www/issues/121), following the photo pattern where a machine holds `ticketsPasscode` in Secrets Manager rather than requiring local env vars.

---

## Question 1

When should the PR workflow allocate an `id` for a new blog/email post?

A) When the PR first adds a `content/posts/**/index.md` that is missing `id` (allocate early; accept burned ids if the PR is abandoned)

B) Only when `draft: false` appears on the PR branch (publish gate; fewer burned ids)

C) Only when a `ready-to-publish` (or similar) label is added to the PR

D) Other (please describe after [Answer]: tag below)

[Answer]: A

---



## Question 2

If the workflow finds an id, how should it apply it?

A) Push a commit to the PR branch that adds `id: N` to frontmatter (fully automated)

B) Comment the allocated id on the PR and leave applying it to a human/agent

C) Open a tiny follow-up commit suggestion / bot PR against the feature branch

D) Other (please describe after [Answer]: tag below)

[Answer]: A

---



## Question 3

What should Option 2 (machine allocate) look like as the durable building block?

A) New authenticated route on the existing tickets API (e.g. machine-only allocate) that reads `ticket-server-secrets` and returns `{ id }` without exposing the passcode to callers

B) Separate small Lambda/API (blog-id helper) that holds `ticketsPasscode` (or reads `ticket-server-secrets`) and calls the existing `/tickets/auth` + `/tickets/next` internally, same idea as `photo-upload-process`

C) No new API — GitHub Actions reads `ticket-server-secrets` (or `photo-upload-secrets.ticketsPasscode`) directly and calls `/tickets/auth` + `/tickets/next` itself; Option 2 deferred

D) Other (please describe after [Answer]: tag below)

[Answer]: A

---



## Question 4

Who may call the machine allocate path (assuming we build Option 2 now)?

A) GitHub Actions only (OIDC → IAM role), sufficient for the PR bot

B) GitHub Actions plus any principal with the deploy/GitHub Actions IAM role (or a dedicated allocate role) so cloud agents with AWS access can call it too

C) Public passcode-gated path is enough; do not add a second machine auth (reuse `/tickets/next` from Actions with the secret)

D) Other (please describe after [Answer]: tag below)

[Answer]: A

---



## Question 5

Which secret should the machine caller use for the ticket passcode?

A) `ticket-server-secrets` (`passcode` field) — canonical ticket secret already in Secrets Manager

B) `photo-upload-secrets` (`ticketsPasscode` field) — same copy photos already use

C) A new dedicated secret (e.g. `blog-publish-secrets`) that only holds what CI/agents need

D) Mirror the passcode into a GitHub Actions secret and skip Secrets Manager for CI

E) Other (please describe after [Answer]: tag below)

[Answer]: A

---



## Question 6

Should this engagement also backfill `id` on the already-published post [Photos without the deploy](https://www.micahwalter.com/posts/photos-without-the-deploy)?

A) Yes — allocate once the machine path works and open a small follow-up commit/PR

B) Yes — manual CLI allocate as a one-off while building automation (if credentials become available)

C) No — leave that post without an id; only new posts get automated allocation

D) Other (please describe after [Answer]: tag below)

[Answer]: A

---



## Question 7

Which content types should the PR bot allocate for?

A) Blog posts only (`type` absent or `blog`)

B) Blog and email posts (anything under `content/posts/` that is not a photo and is missing `id`)

C) Any new `content/posts/**/index.md` missing `id`, regardless of type

D) Other (please describe after [Answer]: tag below)

[Answer]: B

---



## Question: Security Extensions

Should security extension rules be enforced for this project?

A) Yes — enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)

B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---



## Question: Resiliency Extensions

Should the resiliency baseline be applied to this project?

**What this extension is.** Enabling it applies directional, design-time best practices for building resilient systems (AWS Well-Architected Reliability Pillar). It is a starting point, not a production certification.

A) Yes — apply the resiliency baseline as directional best practices and design-time guidance

B) No — skip the resiliency baseline (suitable for PoCs, prototypes, and experimental projects where rapid iteration matters more than reliability)

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---



## Question: Property-Based Testing Extension

Should property-based testing (PBT) rules be enforced for this project?

A) Yes — enforce all PBT rules as blocking constraints

B) Partial — enforce PBT rules only for pure functions and serialization round-trips

C) No — skip all PBT rules (suitable for simple CRUD applications, UI-only projects, or thin integration layers)

X) Other (please describe after [Answer]: tag below)

[Answer]: C