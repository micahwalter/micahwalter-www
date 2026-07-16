# Issues #103 / #104 — Personas

**Branch**: `cursor/photo-metadata-dynamodb-be02`  
**Plan**: Journey-based; Site Owner + Visitor

---

## P1 — Site Owner (Micah)

| Attribute | Detail |
|-----------|--------|
| **Role** | Sole author/operator of micahwalter.com |
| **Goals** | Publish photos quickly from phone or desktop; control titles/captions/tags/featured; organize galleries; avoid waiting on full site deploys |
| **Pain today** | Each photo is a markdown commit + full rebuild; upload is single-file; AI tags require a separate CLI step; no caption field; no map |
| **Environment** | Phone browser (`/upload`), laptop, occasional CLI (`blog photos:*`) |
| **Auth** | Passcode → short-lived token for upload, edit, gallery admin |
| **Success looks like** | Multi-upload with captions → photos live on site in seconds → tweak tags/featured in a web UI → manage galleries without git |

**Primary journeys**: Publish a batch; Fix metadata; Build a gallery; Cut over from markdown

---

## P2 — Visitor

| Attribute | Detail |
|-----------|--------|
| **Role** | Reader / photo viewer of the public site |
| **Goals** | Browse recent and all photos; open a photo detail with caption, tags, EXIF; see where a photo was taken when location is shared; follow old links without dead ends |
| **Pain today** | N/A (works, but owner latency and clutter are invisible); after migration, URL shape changes |
| **Environment** | Mobile and desktop browsers; RSS/search occasionally |
| **Auth** | None (public) |
| **Success looks like** | Fast `/photos` and `/photos/<id>`; optional static map; old `/posts/<id>` photo links redirect cleanly; blog posts unchanged |

**Primary journeys**: Visitor finds a photo (including legacy bookmark)

---

## Persona → journey map

| Journey | Primary persona | Supporting |
|---------|-----------------|------------|
| Publish a batch | Site Owner | Visitor (sees result) |
| Fix metadata | Site Owner | Visitor (sees updates) |
| Visitor finds a photo | Visitor | — |
| Build a gallery | Site Owner | Visitor |
| Cut over from markdown | Site Owner | Visitor (redirects/feeds) |
