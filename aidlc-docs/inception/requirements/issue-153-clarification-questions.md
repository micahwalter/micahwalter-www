# Issue #153 — Clarification Questions

Please answer in this file using `[Answer]:` tags (letter choice, or Other with a short note).

---

## Question 1
How far should we take this engagement after the investigation?

A) Diagnose + fix the Bedrock enrich path, then backfill the known sparse photos (171, 174–181)

B) Diagnose + fix only; I will backfill myself with `blog photos:tag` / force re-enrich

C) Investigation + GitHub issue only for now (no code changes yet)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 2
Can you enable AWS access for this environment so we can read `photo-upload-enrich` CloudWatch logs (`bedrockOk`, `Bedrock tagging failed:`)?

A) Yes — I will run `aws sso login --profile www` (or otherwise provide credentials) and tell you when ready

B) No — proceed from code review + live API evidence only; I will paste relevant log lines if needed

C) I will paste CloudWatch log excerpts for a sparse photo (e.g. id 181) myself in chat

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 3
If Bedrock is failing at invoke time (IAM / model access), who should handle the AWS console side?

A) I will verify/enable Bedrock model access for `us.anthropic.claude-sonnet-4-6` in us-east-1 and confirm the enrich role can invoke it

B) Prefer a code/IAM template fix in-repo if that is sufficient; call out any manual console steps clearly

C) Unknown — recommend the safest path in the plan

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 4
When Bedrock returns no usable tags but geo succeeded, what should enrichment status do?

A) Keep today’s behavior — still mark `complete` (soft-fail), but improve logging/metrics so silent AI loss is obvious

B) Mark a distinct status (e.g. `complete_partial` / keep `pending` for AI) so the UI or ops can spot gaps

C) Retry Bedrock once (or via delayed EventBridge) before giving up

X) Other (please describe after [Answer]: tag below)

[Answer]: A

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

**What this extension is.** Enabling it applies directional, design-time best practices for building resilient systems (AWS Well-Architected Reliability Pillar). It is not a production certification.

A) Yes — apply the resiliency baseline as directional best practices and design-time guidance

B) No — skip the resiliency baseline

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question: Property-Based Testing Extension
Should property-based testing (PBT) rules be enforced for this project?

A) Yes — enforce all PBT rules as blocking constraints

B) Partial — enforce PBT rules only for pure functions and serialization round-trips

C) No — skip all PBT rules

X) Other (please describe after [Answer]: tag below)

[Answer]: C
