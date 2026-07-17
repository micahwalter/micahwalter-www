# U4 — Business Rules (Browse & detail)

| ID | Rule |
|----|------|
| BR-U4-01 | Homepage hero, Recent Photos, `/photos` grid, and `/photos/[id]` load photo data from the **live photo API** via `lib/photos-api.ts` — not from `getPhotos()` markdown. |
| BR-U4-02 | **API-only** during cutover: do not merge markdown photos into photo surfaces. Empty/gap until U7 migration (or early migrate) is accepted. |
| BR-U4-03 | Blog “Recent Posts” and non-photo routes remain markdown/static and unaffected. |
| BR-U4-04 | Photo detail URL is **`/photos/<id>`** (numeric id). Blog posts stay at `/posts/<slug>`. |
| BR-U4-05 | Detail shows title, caption, tags, EXIF when present; **static map** only when both `publicLatitude` and `publicLongitude` are set. |
| BR-U4-06 | When public geo is absent, render **no** map chrome or empty map placeholder. |
| BR-U4-07 | Public UI must **never** display precise GPS; only fuzzed public coords (and derived city/country tags). |
| BR-U4-08 | Static map URL is built from an **OSM / staticmap-style** pattern (no Mapbox token required for U4). |
| BR-U4-09 | Featured photo comes from `GET /photos/featured`. Recent list excludes that featured id. |
| BR-U4-10 | `/photos` lists newest-first in pages of **12** with Load more (cursor), comparable to today’s pagination feel. |
| BR-U4-11 | In-site search includes live photos (title/caption/tags) merged with existing blog results; photo hits link to `/photos/<id>`. |
| BR-U4-12 | Legacy `/posts/<numeric-id>` for photos returns **301** to `/photos/<id>` via **CloudFront Function**. Non-numeric `/posts/<slug>` paths are unaffected. |
| BR-U4-13 | Internal site links for photos use `/photos/<id>` (cards, homepage, search). |
| BR-U4-14 | Authenticated Edit shortcut on detail is a **stub for U5** (visible only when owner session exists later); U4 may render a hidden/disabled placeholder or omit until auth wiring exists — full edit is U5. |
| BR-U4-15 | Missing photo id (404 from API) → friendly not-found UI on `/photos/[id]`; no crash. |
| BR-U4-16 | API/network failure on public surfaces → show retry-friendly error or empty state; do not fall back to markdown photos. |
