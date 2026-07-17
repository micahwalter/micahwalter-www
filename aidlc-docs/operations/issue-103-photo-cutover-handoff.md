# Operations Handoff — Issues #103 / #104 Photo Cutover

**Status:** Construction complete — ready for production cutover deploy  
**PR:** [#110](https://github.com/micahwalter/micahwalter-www/pull/110)  
**Branch:** `cursor/u2-enrichment-functional-design-be02`  
**Units:** U1–U7 Code Generation + Build and Test approved  

## Operations phase note

AI-DLC **Operations** is a placeholder (no automated deploy/monitor workflows in-tool).  
Use this handoff + the cutover runbook for production execution.

**Primary runbook:** `aidlc-docs/construction/u7-cutover/code/cutover-runbook.md`

## Pre-merge

1. Review PR #110 (U6 galleries + U7 cutover + build-and-test docs)  
2. Confirm U2 Bedrock model access in us-east-1 if enrichment is expected  
3. Confirm `NEXT_PUBLIC_PHOTO_API_URL` is set in GitHub Actions secrets for site builds  

## Deploy checklist (summary)

| Step | Action |
|------|--------|
| 1 | Merge PR #110 → `main` |
| 2 | Redeploy `micahwalter-www-github-actions` if IAM template changed |
| 3 | Deploy primary `micahwalter-photo-upload` (FeedPublisher + secret ReplicaRegions) |
| 4 | Confirm `photo-upload-secrets` replica in us-east-2 |
| 5 | Deploy `micahwalter-photo-upload-secondary` |
| 6 | Confirm ApiMapping `photos` on secondary `api.micahwalter.com` |
| 7 | Deploy site (`deploy.yml`) + CF Function updates from `infra/infra.yml` if needed |
| 8 | `migrate-galleries.js` dry-run → `--apply` |
| 9 | `migrate-photos.js` dry-run → `--apply` (+ optional `--gps`) |
| 10 | Verify API + `/photos` + redirects + galleries |
| 11 | Invoke or wait for `photo-upload-feed-publisher` |
| 12 | CLI smoke (`photos:import` / `photos:tag` dry-run) |
| 13 | After verify: `cleanup-photo-content.js --apply --galleries` + commit |
| 14 | Run integration scenarios S1–S9 from `aidlc-docs/construction/build-and-test/integration-test-instructions.md` |

## Rollback (high level)

- Disable feed EventBridge rule if artifacts misbehave  
- Secondary stack can be removed without deleting primary DynamoDB  
- Restore content tree from git if cleanup was premature  
- Redeploy prior Lambda zip / CloudFormation revision  

## Future Operations expansion

When Operations is fully implemented, this handoff can migrate into:

- Deployment planning and execution  
- Monitoring and observability setup  
- Incident response procedures  
- Maintenance and support workflows  
- Production readiness checklists  
