# Code Generation Plan — Issue #143 Social previews

**Unit**: social-preview-metadata  
**Stories**: FR-1..FR-4 in `issue-143-requirements.md`

## Steps

- [x] Step 1: Add `lib/seo.ts` and site share card
- [x] Step 2: Root layout `metadataBase` + default large image; fix title doubling
- [x] Step 3: Index and MDX `generateMetadata` (covers, fallbacks, twitter)
- [x] Step 4: Fallback `public/og/*.html` for home/photos/exposures/galleries
- [x] Step 5: Lambda `og-html.js` + tests
- [x] Step 6: Feed-publisher writes OG HTML for photos, exposures, galleries, indexes
- [x] Step 7: Process + Exposure orchestrator best-effort OG writes + IAM/env
- [x] Step 8: CloudFront crawler rewrite; reserve `og` path segment
- [x] Step 9: `deploy.yml` exclude generated OG prefixes
- [x] Step 10: Build, tests, construction summary
