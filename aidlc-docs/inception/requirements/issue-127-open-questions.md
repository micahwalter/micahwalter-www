# Issue #127 — Open Questions

Periodic photo newsletter (Photosnack-style). Please answer each question below by filling in the letter after `[Answer]:`.

Inspiration: [Photosnack](https://www.photosnack.email/) — one photo + brief text, regular cadence.

---

## Question 1
Who should receive the photo newsletter?

A) Same subscriber list as the long-form newsletter (reuse `newsletter_subscribers` / existing SES path)

B) Dedicated subscriber list (separate signup / table; photo-only audience)

C) Same list for v1, with a clear path to split later if needed

D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 2
When multiple photos are eligible and not yet sent, how should we choose which one goes out?

A) Oldest eligible first (FIFO by `publishedAt` or eligibility time)

B) Newest eligible first

C) Random among eligible unsent

D) Manual pick only for each send (no automatic selection); automation later uses an explicit rule we choose then

E) Automatic with a default rule (e.g. oldest first), but allow overriding with an explicit photo id on manual sends

F) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 3
Should the email body link back to the photo on the site (`/photos/{id}`)?

A) Yes — photo (and/or title) links to `/photos/{id}`

B) Yes — include a clear “View on site” link in addition to the image

C) No — email is self-contained; no site link required

D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 4
Should each send create a site archive entry?

A) Send-only — no archive page on the site

B) Lightweight archive — create a minimal email/archive entry per send (e.g. under `/emails` or a photo-snack listing)

C) Link-only archive — no new content page; rely on the existing `/photos/{id}` page as the canonical record

D) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 5 (optional stretch)
For Sunday (or similar) automation in a later phase, what should happen when the eligible pool is empty?

A) No-op silently (log only)

B) No-op and notify you (email/Slack/etc.)

C) Defer automation entirely until manual sends prove the flow; decide empty-pool behavior then

D) Other (please describe after [Answer]: tag below)

[Answer]: B
