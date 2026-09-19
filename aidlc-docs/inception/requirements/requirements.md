# Photo Map Privacy — Requirements

**Engagement**: Broader (neighborhood-scale) public map location  
**Date**: 2026-09-19  
**Depth**: Standard  
**Branch**: `cursor/photo-map-privacy-fuzz-abab`

## Intent

Visitors viewing a photo detail page should see location context at **neighborhood scale (~1 km)**, not a near-precise pin (~110 m today). Private GPS remains precise for internal enrichment; only public fields and the map UI change.

## Decisions (locked)

| # | Decision |
|---|----------|
| Q1 | Round public coords to **2 decimal places** (~1.1 km) |
| Q2 | Map shows a **broader area without a precise marker** |
| Q3 | **Backfill** existing photos so live maps update |
| Q4 | Change **enricher fuzz + map UI** |
| Ext | Security / Resiliency / PBT — **disabled** |

## Functional requirements

### FR-1 — Coarser public coordinates
- `fuzzPublicCoords` (or equivalent) SHALL round `publicLatitude` / `publicLongitude` to **2 decimal places**.
- Precise `latitude` / `longitude` SHALL remain stored privately and MUST NOT appear in public API DTOs (unchanged invariant).

### FR-2 — Area-style map (no exact pin)
- Photo detail map SHALL center on public coords with a **larger bbox / zoomed-out view**.
- Map SHALL **not** place a marker that implies an exact capture point (no OSM `marker=` pin, or equivalent).
- Place label (`city`, `country`) continues to show when available.

### FR-3 — New uploads
- Enrichment for new GPS photos SHALL write neighborhood-scale public coords using the updated fuzz rule.

### FR-4 — Backfill existing photos
- Existing photos with private GPS (or existing public coords) SHALL be updated so public coords use the 2-decimal rule.
- Prefer a **coords-focused backfill** where practical (recompute public lat/lon from stored private GPS); full force re-enrich is acceptable if that is the safest existing path.
- After backfill, previously published detail pages SHALL show the coarser area map without redeploying content markdown.

## Non-functional requirements

### NFR-1 — Privacy
- Public JSON and map URLs MUST only use fuzzed public coordinates.
- UI MUST avoid visual cues of street-level precision (pin + tight zoom).

### NFR-2 — Compatibility
- Static export / client fetch of photo API unchanged except coordinate values and map URL shape.
- No new third-party map providers required (keep OpenStreetMap embed).

### NFR-3 — Operability
- Backfill MUST be runnable safely (idempotent re-fuzz of public coords; document how to run).
- Enricher unit coverage for the new rounding behavior.

## Out of scope
- Changing city/country reverse-geocode logic or tags
- Removing the map entirely
- Client-side-only fuzzing while leaving ~110 m coords in the API
- Enabling AI-DLC security/resiliency/PBT extensions

## Acceptance criteria
- [ ] New enrichment produces public coords rounded to 2 decimals
- [ ] Photo detail map shows area view without an exact-location marker
- [ ] Public API still omits precise GPS
- [ ] Existing photos with GPS are backfilled to 2-decimal public coords
- [ ] Build (`npm run build`) and enricher unit tests pass

## Traceability
- Builds on issue-103 geo privacy (fuzzed public coords) — tightens from ~110 m to ~1.1 km and softens map UX.
