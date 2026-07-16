# Issues #103 / #104 — Requirements Clarification Follow-ups

I validated your answers. Two items need a clearer choice before I can write the requirements document.

**Locked so far (no change needed):**


| Q     | Decision                                                                            |
| ----- | ----------------------------------------------------------------------------------- |
| 1     | Full cutover this engagement                                                        |
| 2     | Client/API fetch hybrid hosting                                                     |
| 3     | Move public URLs to `/photos/<id>` + redirects from `/posts/<id>`                   |
| 4     | Multi-upload with per-file title/caption/featured only                              |
| 5     | Single `caption`/`description` field for detail + listings/RSS                      |
| 6     | Auto-apply AI tags + editable via edit UI                                           |
| 7     | AI enrichment = tags only (no auto title/caption)                                   |
| 9     | Store precise GPS; round/fuzz for public map display                                |
| 10    | Live API for listings/search; lightweight scheduled job for RSS/sitemap             |
| 12    | Authenticated web edit UI for metadata                                              |
| 13–15 | Skip Security / Resiliency / PBT extensions; **keep multi-region parity** as an NFR |


---



## Ambiguity 1 — Gallery management (from Q11)

You chose **B** (move galleries to DynamoDB) and asked *“but how will we manage them?”*  
Galleries today are markdown lists of photo ids under `content/galleries/`. We need a management model for the DB era.

### Clarification Question 1

How should galleries be created and edited after cutover?

A) **Authenticated gallery admin UI** — Create/rename galleries and add/remove/reorder photo ids on the site (same auth pattern as photo edit / upload passcode)

B) **CLI only** — e.g. `blog gallery:create`, `blog gallery:add`, `blog gallery:remove`; no web gallery admin in v1

C) **Keep gallery definitions in markdown** — Only photo *metadata* moves to DynamoDB; `content/galleries/*/index.md` stays the source of gallery membership (simpler ops; contradicts pure “galleries in DynamoDB” but is a valid hybrid)

D) **Same photo edit surface** — Minimal: galleries as named lists editable via API + a simple page under `/upload` or `/admin`; polish later

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---



## Ambiguity 2 — Country / city tags (from Q8)

You chose **B** (static map image when GPS present) and added: *“would like to also add country / city as tags.”*

### Clarification Question 2

How should country/city become tags?

A) **Auto from reverse geocode** — When GPS exists, reverse-geocode (e.g. city + country) and merge those strings into `tags` automatically (alongside Bedrock AI tags)

B) **Separate location fields + tags** — Store `city` / `country` (and optional place label) as dedicated metadata fields used for display; also add them to `tags` for filtering/search

C) **Dedicated fields only** — Store `city` / `country` for display near the map; do **not** auto-add them to `tags` (author can add manually)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

When both answers are filled in, reply here and I will finalize `issue-103-requirements.md`.