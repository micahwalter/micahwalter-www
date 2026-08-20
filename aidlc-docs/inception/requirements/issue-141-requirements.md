# Requirements — Issue #141 Exposure queue in admin

| Field | Value |
|-------|--------|
| **Issue** | [#141](https://github.com/micahwalter/micahwalter-www/issues/141) — Create a way for me to see my current Exposures queue |
| **User request** | Somewhere in the admin panel, see what is coming up in the Exposures queue, and maybe what has already been sent |
| **Request type** | Enhancement (owner admin UI + authenticated read API) |
| **Depth** | Standard |
| **Scope** | Photos admin (`/upload`) + photo-upload photos API; reuse public Exposures archive for sent issues |

## Intent analysis

- **Clarity**: Clear enough to implement. “Queue” in production is an unordered **pool** of public, eligible, unsent photos; Sunday’s orchestrator picks one at random.
- **Complexity**: Simple/moderate — existing `listExposureCandidates` + public `listExposures` cover the data; admin lacks a dedicated view.
- **Brownfield**: Yes. Reverse engineering for Exposure exists from #127; no full RE rerun.

## Functional requirements

### FR-1 — Upcoming pool in admin

1. After unlocking `/upload`, an **Exposures** tab shows every photo the Sunday orchestrator would consider: public (`draft = false`), `exposureEligible = true`, and not yet stamped (`exposureSentAt` missing or null).
2. Each row shows enough to recognize the photo (thumbnail, title, id) and a way to open it in the existing Edit tab.
3. Copy must not imply FIFO order. State that Sunday 09:00 America/New_York picks **one at random** from this pool.
4. Empty pool: explain that nothing will send until photos are marked Eligible for Exposure on Edit (or Upload).

### FR-2 — Already sent

1. The same tab lists recent production Exposures (issue number, title, sent date), newest first.
2. Link to the public archive page `/exposures/{n}` and to Edit for the photo id when present.
3. Empty sent list is allowed (no issues yet).

### FR-3 — Auth and API

1. Upcoming pool is owner-only: `GET /photos/exposure-queue` requires the same Bearer session as other admin photo routes.
2. Unauthenticated callers receive 401. The handler must not treat `exposure-queue` as a photo id.
3. Sent issues may use the existing public Exposures list API (no new owner fields required).

### FR-4 — Failover

1. Primary `infra/photo-upload.yml` and secondary `infra/photo-upload-secondary.yml` both expose `GET /exposure-queue` so failover still serves the admin read.

## Non-functional

- Same CORS / passcode session as `/upload` (localhost + production site origin).
- Personal-scale catalog: reuse `listExposureCandidates` cap (up to 200).
- No change to Sunday send behavior, eligibility flags, or public archive pages.

## Out of scope

- Reordering the pool or forcing next Sunday’s pick
- Showing draft-eligible photos that are not in the Sunday pool
- Subscriber send receipts / per-address status
- Changing random selection to FIFO

## Acceptance

- [ ] Unlocked admin has an Exposures tab
- [ ] Tab lists current eligible unsent photos (the Sunday pool)
- [ ] Tab lists already-sent Exposure issues
- [ ] Copy makes random weekly pick explicit
- [ ] Unauthenticated `GET /exposure-queue` is 401

## Extensions

Security / resiliency / property-based testing remain **disabled** (project-level decision from prior engagements). Auth for the new route follows the existing photos admin pattern.
