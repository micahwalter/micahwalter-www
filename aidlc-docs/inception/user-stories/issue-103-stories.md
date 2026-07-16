# Issues #103 / #104 — User Stories

**Organization**: Journey-based  
**Granularity**: Small / vertical  
**Acceptance criteria**: Checklist  
**IDs**: `US-###` with FR/NFR mapping  
**Personas**: [issue-103-personas.md](./issue-103-personas.md)  
**Requirements**: [issue-103-requirements.md](../requirements/issue-103-requirements.md)

---

## Journey 1 — Publish a batch

### US-001 — Multi-file upload with per-file metadata
**Persona**: Site Owner  
**Story**: As a Site Owner, I want to select multiple photos on `/upload` and set title, caption, and featured per file so I can publish a batch in one session.  
**Maps**: FR-6, FR-2.2–2.3

**Acceptance criteria**
- [ ] `/upload` accepts multiple image files in one session
- [ ] Each file has its own title, caption, and featured controls
- [ ] Each file shows upload progress/status independently
- [ ] Passcode auth still required before upload
- [ ] JPEG/PNG constraints remain as today (unless explicitly extended later)

---

### US-002 — Upload persists to DynamoDB without a git commit
**Persona**: Site Owner  
**Story**: As a Site Owner, when my upload finishes processing, I want the photo metadata stored in the database (not committed as markdown) so publishing does not wait on a site deploy.  
**Maps**: FR-1, FR-2.1, FR-2.8, NFR-1, FR-11.3

**Acceptance criteria**
- [ ] Process pipeline writes a photo record keyed by ticket `id`
- [ ] No new `content/posts/.../index.md` is created for the upload
- [ ] Process Lambda does not commit photo markdown to GitHub
- [ ] Images still land on the existing images CDN paths
- [ ] Photo is readable via the public photo API after processing succeeds

---

### US-003 — Auto AI tags on upload
**Persona**: Site Owner  
**Story**: As a Site Owner, I want Bedrock vision tags applied automatically when a photo is processed so I do not need a separate `blog photos:tag` step for every upload.  
**Maps**: FR-2.6, NFR-6

**Acceptance criteria**
- [ ] Process/enrichment invokes Bedrock with the same tagging intent as `scripts/tag-photos.js` (3–8 content tags)
- [ ] Tags are stored on the photo record and returned by the API
- [ ] Author-provided tags (if any) are merged, not wiped
- [ ] Title and caption are not overwritten by AI
- [ ] If tagging fails, the photo still publishes; failure is logged and tags can be fixed later (US-006 / CLI backfill)

---

### US-004 — GPS enrichment, fuzzed public geo, city/country tags
**Persona**: Site Owner  
**Story**: As a Site Owner, when a photo has GPS EXIF, I want location enriched automatically (city/country tags + privacy-safe public coordinates) so visitors can see place context without exposing exact location.  
**Maps**: FR-2.4–2.5, NFR-4

**Acceptance criteria**
- [ ] GPS is extracted from EXIF when present
- [ ] Precise coordinates are stored internally
- [ ] Public API exposes only fuzzed/rounded coordinates (or equivalent public fields)
- [ ] Reverse geocode yields city and country that are merged into `tags`
- [ ] Photos without GPS skip geo enrichment and do not fail the upload

---

## Journey 2 — Fix metadata

### US-005 — Authenticated photo edit UI
**Persona**: Site Owner  
**Story**: As a Site Owner, I want to edit a photo’s title, caption, tags, and featured flag on the site so I can fix metadata without git or a redeploy.  
**Maps**: FR-7, FR-3.3, US-003 follow-up

**Acceptance criteria**
- [ ] Authenticated edit surface can load an existing photo by id
- [ ] Owner can update title, caption, tags, and featured
- [ ] Changes persist to DynamoDB and appear on public API-backed pages without a site deploy
- [ ] Unauthenticated users cannot modify photos
- [ ] Auth uses the same passcode → token family as upload (or a documented shared admin session)

---

### US-006 — CLI can update or retag DB-backed photos
**Persona**: Site Owner  
**Story**: As a Site Owner, I want CLI import/tag flows to target the photo API/DB so desktop workflows stay useful after markdown is gone.  
**Maps**: FR-10

**Acceptance criteria**
- [ ] `blog photos:import` (or successor) creates DB records rather than photo markdown as source of truth
- [ ] `blog photos:tag` can retag an existing DB photo (backfill / retry)
- [ ] CLI does not require committing photo `index.md` for new imports

---

## Journey 3 — Visitor finds a photo

### US-007 — Browse photos from the live API
**Persona**: Visitor  
**Story**: As a Visitor, I want the homepage hero, recent photos, and `/photos` grid to show current photos from the API so new uploads appear without a site rebuild.  
**Maps**: FR-3.1, FR-4.1, FR-9.1, NFR-1

**Acceptance criteria**
- [ ] Homepage featured photo is loaded from the photo API
- [ ] Recent photos section uses API data (excluding hero as today)
- [ ] `/photos` lists photos from the API with pagination comparable to today
- [ ] Blog “Recent Posts” remains markdown/static and unaffected

---

### US-008 — Photo detail at `/photos/<id>`
**Persona**: Visitor  
**Story**: As a Visitor, I want to open a photo at `/photos/<id>` and see caption, tags, EXIF, and an optional static map so I can enjoy the photo with useful context.  
**Maps**: FR-4.2–4.3, FR-5.2

**Acceptance criteria**
- [ ] Detail route is `/photos/<id>` (numeric id)
- [ ] Page shows title, single caption field, tags, and EXIF when present
- [ ] When public geo exists, a static map image is shown
- [ ] When geo is absent, no map chrome/empty map is shown
- [ ] Public page does not reveal precise GPS
- [ ] Blog posts remain at `/posts/<slug>`

---

### US-009 — Legacy `/posts/<id>` photo URLs redirect
**Persona**: Visitor  
**Story**: As a Visitor with an old photo bookmark, I want `/posts/<photo-id>` to redirect to `/photos/<photo-id>` so my links keep working.  
**Maps**: FR-5.1, NFR-7

**Acceptance criteria**
- [ ] For each migrated photo id, `/posts/<id>` returns a permanent redirect to `/photos/<id>`
- [ ] Non-photo blog slugs under `/posts/` are unaffected
- [ ] Internal site links use `/photos/<id>` for photos

---

### US-010 — In-site search includes live photos
**Persona**: Visitor  
**Story**: As a Visitor, I want site search to find photos by title/caption/tags from live API data so newly uploaded photos are discoverable.  
**Maps**: FR-9.1

**Acceptance criteria**
- [ ] Search results can include DB-backed photos without waiting for a full site deploy
- [ ] Photo results link to `/photos/<id>`
- [ ] Blog post search continues to work for markdown posts

---

## Journey 4 — Build a gallery

### US-011 — Gallery admin UI
**Persona**: Site Owner  
**Story**: As a Site Owner, I want an authenticated gallery admin UI to create galleries and add/remove/reorder photos so I can manage collections without markdown files.  
**Maps**: FR-8.1–8.2

**Acceptance criteria**
- [ ] Owner can create and rename a gallery after auth
- [ ] Owner can add/remove photo ids and reorder membership
- [ ] Gallery definitions persist in DynamoDB
- [ ] Unauthenticated users cannot modify galleries

---

### US-012 — Public galleries resolve DB photos
**Persona**: Visitor  
**Story**: As a Visitor, I want public gallery pages to show photos from the database so galleries stay correct after markdown cutover.  
**Maps**: FR-8.3–8.4

**Acceptance criteria**
- [ ] Public gallery pages load membership from DynamoDB
- [ ] Photo tiles/detail links use `/photos/<id>` and API metadata
- [ ] Existing galleries are migrated from `content/galleries/*/index.md`

---

## Journey 5 — Cut over from markdown

### US-013 — Migrate existing photos into DynamoDB
**Persona**: Site Owner  
**Story**: As a Site Owner, I want all existing photo markdown records migrated into DynamoDB (with GPS backfill where originals allow) so the site can run from one source of truth.  
**Maps**: FR-1.4, FR-2.4

**Acceptance criteria**
- [ ] All existing ~43 photo posts are imported with stable ids
- [ ] Core fields (title, featured, tags, EXIF, folder/image keys, publishedAt) are preserved
- [ ] GPS is backfilled from S3 originals when EXIF GPS exists
- [ ] Migration is idempotent or safely re-runnable for failed rows
- [ ] Migrated photos are readable via the public API

---

### US-014 — Stop markdown photo source of truth and clean content tree
**Persona**: Site Owner  
**Story**: As a Site Owner, after cutover I want photo folders removed from `content/posts/` and processing to never write photo markdown so the content tree only holds blog/email.  
**Maps**: FR-11, FR-2.1

**Acceptance criteria**
- [ ] Photo upload/process path does not write or commit photo markdown
- [ ] Photo directories are removable from `content/posts/` after verification
- [ ] Remaining `content/posts/` entries are blog and email only
- [ ] Site blog/email builds still succeed

---

### US-015 — Scheduled RSS/sitemap updates for photos
**Persona**: Visitor (consumer of feeds) / Site Owner (ops)  
**Story**: As a feed consumer, I want photo URLs in RSS/sitemap refreshed by a lightweight scheduled job so feeds stay current without a full Next.js rebuild.  
**Maps**: FR-9.2–9.3, NFR-1

**Acceptance criteria**
- [ ] A scheduled job updates photo entries in RSS and/or sitemap (as designed) from the photo API/DB
- [ ] Job does not require a full static site rebuild
- [ ] Blog markdown feed generation can remain on the existing prebuild path
- [ ] New photo URLs in feeds use `/photos/<id>`

---

### US-016 — Multi-region parity for photo data plane
**Persona**: Site Owner  
**Story**: As a Site Owner, I want the photo metadata/API posture to match the site’s multi-region expectations so photos are as resilient as peer stacks.  
**Maps**: NFR-3

**Acceptance criteria**
- [ ] Design/implementation documents primary + secondary posture consistent with existing API/images patterns
- [ ] Failover or replication approach for photo metadata is implemented or explicitly staged with a tracked follow-up if infrastructure limits apply — default expectation is parity in this engagement

---

## Coverage matrix

| Requirement | Stories |
|-------------|---------|
| FR-1 | US-002, US-013 |
| FR-2 | US-001–004, US-014 |
| FR-3 | US-002, US-005, US-007 |
| FR-4 | US-007, US-008 |
| FR-5 | US-008, US-009 |
| FR-6 | US-001 |
| FR-7 | US-005 |
| FR-8 | US-011, US-012 |
| FR-9 | US-007, US-010, US-015 |
| FR-10 | US-006 |
| FR-11 | US-002, US-014 |
| NFR-1 | US-002, US-007, US-015 |
| NFR-3 | US-016 |
| NFR-4 | US-004, US-005, US-008 |
| NFR-6 | US-003 |
| NFR-7 | US-009, US-013 |

---

## INVEST notes

- Stories are **Independent** enough to demo vertically once shared infra (table/API) exists; early stories may share foundation work called out in Workflow Planning units.
- **Negotiable** implementation details (map provider, fuzz radius, exact admin routes) deferred to design stages.
- Each story is **Valuable** to Owner or Visitor.
- **Estimable** at unit-planning time; sizes kept small/vertical per plan.
- **Small** relative to full cutover; cutover split into US-013–016.
- **Testable** via checklist acceptance criteria above.
