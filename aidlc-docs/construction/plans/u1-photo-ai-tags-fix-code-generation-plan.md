# Code Generation Plan — U1 Photo AI Tags Fix (#153)

**Unit**: `u1-photo-ai-tags-fix`  
**Issue**: [#153](https://github.com/micahwalter/micahwalter-www/issues/153)  
**Requirements**: `aidlc-docs/inception/requirements/issue-153-requirements.md`  
**Execution plan**: `aidlc-docs/inception/plans/issue-153-execution-plan.md`  
**Code location**: `infra/photo-upload-lambdas/` (+ optional `infra/photo-upload.yml`)  
**Docs location**: `aidlc-docs/construction/u1-photo-ai-tags-fix/code/`

## Unit context

| Item | Detail |
|------|--------|
| Goal | Restore Bedrock vision tags on enrich; keep soft-fail `complete`; improve logs; backfill sparse ids |
| Stories | FR-1…FR-5 / NFR-1…NFR-4 from requirements (no user-stories stage) |
| Dependencies | S3 images, DynamoDB photos, EventBridge PhotoPendingEnrichment, Bedrock Converse |
| Out of scope | Full catalog retag; tag UI changes; coverImageKey path cleanup |

## Likely root causes (pre-CloudWatch)

1. **Bedrock invoke soft-fail** (model access / IAM) — geo succeeds; `aiTags=[]`; status still `complete`
2. **IAM too narrow for cross-region inference profile** — role allows `foundation-model/*` only in stack region; `us.anthropic.*` profiles often need multi-region foundation-model ARNs
3. **Response parse fragility** — non-comma lists / prose → filtered to empty array with no throw

## Generation steps

### Step 1 — AWS diagnosis gate
- [x] Confirm `aws sts get-caller-identity --profile www`
- [x] Pull recent `photo-upload-enrich` CloudWatch logs for sparse ids (e.g. 181): `bedrockOk`, `Bedrock tagging failed`, cover warnings
- [x] Record root-cause note in `aidlc-docs/construction/u1-photo-ai-tags-fix/code/diagnosis.md`
- [x] If SSO still unavailable: proceed with code-review fixes (Steps 2–5) and re-run diagnosis when credentials arrive

**Diagnosis result (2026-09-13):** IAM denies `bedrock:InvokeModel` on `arn:aws:bedrock:us-east-2::foundation-model/anthropic.claude-sonnet-4-6` (cross-region inference profile). Enrich soft-fails with `bedrockOk:false`, `tagCount:3`. Step 3 IAM widen is **required**, not optional.

### Step 2 — Harden Bedrock tag parsing + logging
- [x] Modify `infra/photo-upload-lambdas/src/lib/bedrock-tags.js`:
  - Parse comma **or** newline / bullet lists
  - Strip `Tags:` prefixes / prose wrappers
  - Log truncated raw response + parsed count on empty/failure (no secrets)
- [x] Modify `infra/photo-upload-lambdas/src/enrich.js` completion log to include `aiTagCount`, `geoTagCount`, and whether cover was found (keep `enrichmentStatus: complete` on soft-fail)

### Step 3 — IAM / model invoke fix (if indicated)
- [x] **REQUIRED**: Update `infra/photo-upload.yml` EnrichFnRole Bedrock resources to cover:
  - inference profile ARNs for `us.anthropic.*` (existing us-east-1 account profiles OK)
  - foundation-model ARNs needed by cross-region profiles: `arn:aws:bedrock:*::foundation-model/anthropic.*`
- [x] Keep `BEDROCK_MODEL_ID` aligned with CLI unless diagnosis forces a documented change

### Step 4 — Unit tests
- [x] Add `infra/photo-upload-lambdas/src/lib/bedrock-tags.test.js` for parse helpers (comma, newline, bullets, empty, oversize)
- [x] Add/extend enrich logging assertions only if cheap without AWS mocks; otherwise keep tests on pure parse/merge
- [x] Run existing lambda unit tests (`node --test` or package script as used in repo)

### Step 5 — Code summary artifact
- [x] Write `aidlc-docs/construction/u1-photo-ai-tags-fix/code/code-summary.md` (modified files, root cause, deploy notes)

### Step 6 — Branch, commit readiness (local)
- [x] Create branch `cursor/fix-photo-ai-tags-ece0`
- [x] Stage application + aidlc docs for review (publish only with user approval per git-review rule **unless** cloud-agent publish already authorized for this task — prefer ask before push if unsure)

### Step 7 — Deploy path documentation
- [x] Document required deploy: `photo-upload-deploy.yml` (code and/or CFN if IAM changed)
- [x] Note user Bedrock console prerequisite

### Step 8 — Live verify + backfill (post-deploy / with AWS)
- [x] Force re-enrich or upload smoke; confirm `bedrockOk: true` and AI tags on API
- [x] Backfill ids **171, 174, 175, 176, 177, 178, 180, 181** via force enrich and/or `blog photos:tag --auto-approve`
- [x] Capture evidence (API tag lists) for Build and Test

## Checkbox tracking rule
Mark each step `[x]` in this file in the same interaction the work completes.

## Approval
This plan is the single source of truth for Code Generation Part 2. Do not generate/modify application code until the plan is approved.
