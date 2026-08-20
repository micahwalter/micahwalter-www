# User Stories — Issue #141 Exposure queue in admin

## Persona

**Owner (Micah)** — authenticates to `/upload` with the photo passcode. Marks photos eligible for Exposure and wants to know what Sunday might send, and what already went out.

## US-1 — See the upcoming pool

As the owner, I want to open an Exposures section in photos admin so I can see which photos are in the Sunday pool without paging through Edit.

**Acceptance**

- Tab is visible after unlock
- List matches orchestrator candidates (public, eligible, unsent)
- Empty state tells me to mark photos eligible
- Copy says Sunday picks one at random at 9:00 AM Eastern

## US-2 — Jump to edit

As the owner, I want to open a pooled photo in Edit so I can un-mark eligibility or send a test.

**Acceptance**

- Control navigates to the existing Edit flow for that photo id (`/upload?edit={id}`)

## US-3 — See what already sent

As the owner, I want to see recent Exposure issues on the same tab so I do not have to leave admin for `/exposures`.

**Acceptance**

- Newest-first list with issue number, title, sent date
- Link to `/exposures/{n}`
