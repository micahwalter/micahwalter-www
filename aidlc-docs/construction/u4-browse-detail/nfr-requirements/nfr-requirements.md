# U4 — NFR Requirements

**Unit**: Browse & detail  
**Decisions from**: `u4-browse-detail-nfr-requirements-plan.md` (All A)

---

## Scalability

| ID | Requirement |
|----|-------------|
| NFR-U4-S1 | Design for **personal / low traffic** (align U1): low thousands of page views/day; API list/featured/get remain on-demand. |
| NFR-U4-S2 | Search prefetch caps at a **bounded** page walk (soft target ≈100 photos); do not unbounded-scroll the entire table in the client. |
| NFR-U4-S3 | Multi-region photo API parity **out of scope for U4** (U7 / NFR-3). |

## Performance

| ID | Requirement |
|----|-------------|
| NFR-U4-P1 | **Best effort** UI responsiveness — no hard SLO. Soft goal: photo sections interactive within a couple of seconds on a warm API. |
| NFR-U4-P2 | Homepage / `/photos` use list `limit=12` (U1 default); Load more uses cursor. |
| NFR-U4-P3 | Search: prefetch photo catalog **once per SearchBar open** (or until closed), then filter locally — avoid per-keystroke API calls. |
| NFR-U4-P4 | No special in-memory session cache across navigations (Q6=A); fetch on mount is fine. |

## Availability / reliability

| ID | Requirement |
|----|-------------|
| NFR-U4-R1 | API/network failure → user-visible error + **Retry** on photo surfaces; **no** markdown fallback (FD Q2=A). |
| NFR-U4-R2 | Static map image load failure → **hide map** (no alternate provider) (Q3=A). |
| NFR-U4-R3 | Missing photo (404) → not-found UI; must not crash the app shell. |
| NFR-U4-R4 | CloudFront redirect Function failure must not break non-photo `/posts/<slug>` blog routes (pass-through). |

## SEO / static export

| ID | Requirement |
|----|-------------|
| NFR-U4-SEO1 | **Accept client-rendered SEO** for U4 — crawlers/social previews may be weak for new `/photos/[id]` pages (Q1=A). |
| NFR-U4-SEO2 | Detail route must work with `output: "export"` via **client detail + placeholder `generateStaticParams`** (Q5=A); document any prod slug caveats in Code Gen. |
| NFR-U4-SEO3 | Blog/email static generation remains unchanged (NFR-2). |

## Security / privacy

| ID | Requirement |
|----|-------------|
| NFR-U4-SEC1 | Public pages use only PublicPhotoDTO fields; never render precise GPS. |
| NFR-U4-SEC2 | No new secrets for maps (OSM/staticmap URL; no Mapbox token). |
| NFR-U4-SEC3 | Edit shortcut remains non-functional stub in U4 (no PATCH wiring); auth edit is U5. |
| NFR-U4-SEC4 | Rely on existing API CORS for `www` + `localhost`; no broadening beyond current photo API origins without need. |

## Usability

| ID | Requirement |
|----|-------------|
| NFR-U4-U1 | Lightweight loading (skeleton or short “Loading…”) on home photo blocks, grid, and detail (Q4=A). |
| NFR-U4-U2 | Empty API catalog (pre-migration) shows clear empty-state copy on `/photos` / home photo sections. |
| NFR-U4-U3 | Preserve existing visual language (grid feel, PhotoLayout patterns). |

## Compatibility

| ID | Requirement |
|----|-------------|
| NFR-U4-COMPAT1 | Internal photo links use `/photos/<id>`. |
| NFR-U4-COMPAT2 | Legacy numeric `/posts/<id>` → 301 `/photos/<id>` via CloudFront Function (FD Q4=A; NFR-7). |
| NFR-U4-COMPAT3 | giscus: document pathname change for photo comments; no mandatory migration tooling in U4 beyond using new paths. |

## Observability

| ID | Requirement |
|----|-------------|
| NFR-U4-O1 | Client: no new analytics product required; existing Fathom continues on page loads. |
| NFR-U4-O2 | Redirect Function: rely on CloudFront standard logging if already enabled; no new alarm required in U4. |

## Maintainability

| ID | Requirement |
|----|-------------|
| NFR-U4-M1 | Extend `lib/photos-api.ts`; prefer small client islands over rewriting the whole app. |
| NFR-U4-M2 | Redirect logic lives in CloudFront infra (`infra/infra.yml` or existing CF function pattern from prior redirect work), not Next.js pages. |
