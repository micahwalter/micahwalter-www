# Personas — Photo UX Polish

## P1 — Visitor
- **Role**: Public reader of micahwalter.com
- **Goals**: Enjoy photos, understand where a photo was taken, browse related photos by theme/place, browse galleries without layout awkwardness, see the homepage featured image without a jarring text loader
- **Tech comfort**: Typical web user; expects links and maps to work in the browser
- **Constraints**: Sees only public photo fields (fuzzed coords, city/country, tags)

## P2 — Owner (Micah)
- **Role**: Site owner who uploads and edits photos
- **Goals**: After upload + enrichment, location appears correctly on the detail page; tags are useful for visitors; site chrome (home, galleries) feels polished
- **Tech comfort**: High; uses `/upload` and CLI
- **Note**: Owner edit flows are largely unchanged in this engagement; Owner appears where polish affects post-upload experience

## Persona → Story map

| Persona | Stories |
|---------|---------|
| Visitor | US-1, US-2, US-3, US-4 |
| Owner | US-1 (verify map after upload), US-5 (API list reliability for clients) |
