# Issues #103 / #104 — Requirements Clarification Questions

Please answer each question by filling in the letter after `[Answer]:` in this file.  
If none of the options fit, choose the last option (**Other**) and describe your preference after the tag.

**Engagement context (already captured):**

- Migrate photo metadata from markdown in `content/posts/` to a database
- Serve photos dynamically so publish does **not** require a full site rebuild
- Keep blog + email posts on static markdown
- Additional requirements (#104): multi-photo upload, title + description/caption, geo/map when present, automatic AI tags via upload API (Bedrock, like `blog photos:tag`)
- Branch: `cursor/photo-metadata-dynamodb-be02`
- Issues: [#103](https://github.com/micahwalter/micahwalter-www/issues/103), [#104](https://github.com/micahwalter/micahwalter-www/issues/104)

---



## Question 1 — Delivery scope for this engagement

What should we deliver in this AI-DLC engagement?

A) **Full cutover** — DynamoDB + read/write APIs, multi-upload UI, auto AI tags, GPS/map, migrate existing 43 photos, stop writing photo markdown, remove photo folders from content

B) **Phased MVP first** — DynamoDB + APIs + process Lambda writes DB (dual-write with markdown still), multi-upload + caption fields, auto AI tags; map UI and markdown deletion in a follow-up

C) **Backend foundation only** — DynamoDB schema, process Lambda → DB (dual-write), public read API, migration script; defer multi-upload UI, map, and frontend wiring to a follow-up

D) **Design + spike only** — Requirements, architecture, and a thin spike (e.g. table + one read endpoint); implementation in a later engagement

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



## Question 2 — How photo pages are served (hosting model)

Given `output: "export"` (no Next.js SSR in production), which approach should we target?

A) **Client/API fetch (hybrid)** — Keep static site shells; homepage, `/photos`, and photo detail load metadata from `api.micahwalter.com` at runtime

B) **Separate HTML origin** — CloudFront routes photo URLs to a Lambda/API that returns HTML from DynamoDB; blog pages stay on S3

C) **Change hosting** — Move away from pure static export (ISR/SSR or dual-deploy) so Next can render photos dynamically

D) **Decide in Application Design** — Lock functional requirements now; pick hosting option after design tradeoffs

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



## Question 3 — Public URL shape for photos

A) **Keep** `/posts/<id>` — Numeric IDs stay under `/posts/`; blog posts keep title slugs

B) **Move to** `/photos/<id>` — Cleaner split; add permanent redirects from `/posts/<id>` for existing photo URLs

C) **Keep** `/posts/<id>` **for existing; new photos use** `/photos/<id>` — Mixed (generally avoid unless you have a reason)

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---



## Question 4 — Multi-photo upload UX

A) **Per-file fields only** — Each selected file has its own title, caption, featured toggle; no batch defaults

B) **Batch defaults + per-file overrides** — Shared title/caption/featured defaults for the batch; can override per file before upload

C) **Minimal batch** — Multi-file select with one shared title prefix / caption / featured; no per-file editing in v1 (edit after upload)

X) Other (please describe after [Answer]: tag below)

[Answer]:  A

---



## Question 5 — Caption vs excerpt

A) **Separate fields** — `caption` (detail page body) and `excerpt` (cards/RSS/search); upload form edits caption; excerpt can default from caption

B) **Single field** — One `description`/`caption` used for both detail and listings/RSS

C) **Caption only for now** — Store caption; keep generating a short excerpt automatically from camera/AI until we need both

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---



## Question 6 — Automatic AI tagging behavior

A) **Always auto-apply** — Process pipeline applies Bedrock tags immediately (like CLI `--auto-approve`); author can edit later

B) **Auto-apply + editable** — Same as A, but v1 includes a simple authenticated edit path (or upload UI review step) to tweak tags before/after publish

C) **Suggest only** — Generate tags but require explicit approve in upload UI before they are saved

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---



## Question 7 — AI enrichment beyond tags

A) **Tags only** — Match today’s `blog photos:tag` (3–8 content tags)

B) **Tags + suggested title** — If title empty/generic (e.g. IMG_1234), suggest a title; never overwrite an author-provided title

C) **Tags + title + caption draft** — Also draft a short caption; author can edit

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



## Question 8 — Maps / geo display

A) **Interactive map when GPS present** — e.g. MapLibre + OpenStreetMap (or similar); hide entirely when no coords

B) **Static map image when GPS present** — Simpler (no JS map lib); link out to OpenStreetMap/Google

C) **Text + coordinates only in v1** — Show location/lat-lon in EXIF panel; add map UI in a follow-up

X) Other (please describe after [Answer]: tag below)

[Answer]: B, would like to also add country / city as tags

---



## Question 9 — GPS privacy

A) **Publish exact coordinates** — Store and display full EXIF GPS

B) **Round / fuzz for public display** — Store precise coords privately if needed, but display rounded (e.g. ~100–500m) on the public site

C) **Opt-in per photo** — Default: no public map/coords; author can enable location display

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---



## Question 10 — Feeds, sitemap, and search after cutover

A) **API-backed at build or on a schedule** — Prebuild scripts fetch photos from API when generating RSS/sitemap/`posts.json` (may lag until next site deploy or scheduled rebuild)

B) **Dynamic where possible** — Search/listings hit the photo API live; keep RSS/sitemap updated via a lightweight scheduled job (not full site rebuild)

C) **Accept lag for v1** — Photo pages/listings live immediately via API; RSS/sitemap/search update on next normal site deploy only

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---



## Question 11 — Galleries

A) **Keep galleries as markdown** — `content/galleries/*/index.md` still lists photo ids; resolve photo metadata from the API/DB at build or runtime

B) **Move galleries to DynamoDB too** — Same engagement if scope allows

C) **Defer galleries** — Leave working as today until photos are migrated; fix breakage only if needed

X) Other (please describe after [Answer]: tag below)

[Answer]: B, but how will we manage them?

---



## Question 12 — Post-upload editing

A) **Authenticated edit UI on the site** — Update title, caption, tags, featured, location visibility without git

B) **API + CLI only for v1** — `blog photos:update` (or similar); no web edit UI yet

C) **Upload-time only for v1** — Set metadata at upload; changes require re-upload or manual DB/API later

X) Other (please describe after [Answer]: tag below)

[Answer]:  A

---



## Question 13 — Security Baseline extension

Should security extension rules be enforced for this project?

A) Yes — enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)

B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---



## Question 14 — Resiliency Baseline extension

Should the resiliency baseline be applied to this project?

**What this extension is.** Enabling it applies directional, design-time best practices from the AWS Well-Architected Framework (Reliability Pillar). It is a starting point, not a production certification.

**What this extension is NOT.** It does not make the workload production-ready or guarantee availability/RTO/RPO.

A) Yes — apply the resiliency baseline as directional best practices and design-time guidance

B) No — skip the resiliency baseline

X) Other (please describe after [Answer]: tag below)

[Answer]: B, but maintain multi-region status on par with rest of the site

---



## Question 15 — Property-Based Testing extension

Should property-based testing (PBT) rules be enforced for this project?

A) Yes — enforce all PBT rules as blocking constraints

B) Partial — enforce PBT rules only for pure functions and serialization round-trips

C) No — skip all PBT rules (this repo has no test runner today; suitable if we keep validation lightweight)

X) Other (please describe after [Answer]: tag below)

[Answer]: C

---

When all `[Answer]:` lines are filled in, reply here (e.g. “done”) and I will validate answers and produce the requirements document.