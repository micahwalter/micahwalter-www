# U1 — Photo data plane — Code Generation Plan

**Stories**: US-002  
**Design inputs**: `aidlc-docs/construction/u1-photo-data-plane/{functional-design,nfr-requirements,nfr-design,infrastructure-design}/`  
**Code location**: workspace root — primarily `infra/photo-upload-lambdas/`, `infra/photo-upload.yml` (NOT aidlc-docs/)  
**Approach**: Brownfield — extend existing photo-upload package; strip GitHub commit from process  

This plan is the **single source of truth** for U1 Code Generation. Execute steps in order; mark `[x]` when complete.

---

## Unit context

| Item | Detail |
|------|--------|
| Deliverable | DynamoDB photos + public GET + HMAC PATCH + process persists to DB + EventBridge enrich event + process DLQ; no markdown commit |
| Depends on | Existing tickets API, uploads/images buckets, photo-upload auth |
| Enables | U2 enrichment consumer; U3/U4 clients |

---

## Generation steps

### Step 1 — Repository / domain layer
- [ ] Add Photo record helpers (defaults for title/caption, GSI keys `gsi1pk`/`gsi1sk`, timestamps)
- [ ] Add DynamoDB client module: `putPhoto`, `getPhoto`, `updatePhoto`, `listPhotos` (cursor), `getFeaturedPhoto`
- [ ] Files under `infra/photo-upload-lambdas/src/lib/` (e.g. `photos-db.js`, `photo-defaults.js`)

### Step 2 — Public DTO + auth reuse
- [ ] Add `PublicDtoProjector` (strip precise GPS)
- [ ] Reuse existing token verify for PATCH
- [ ] Files: e.g. `src/lib/photo-dto.js`; wire existing `token.js`

### Step 3 — HTTP read/patch handlers
- [ ] Implement GET `/photos`, GET `/photos/featured`, GET `/photos/{id}`, PATCH `/photos/{id}`
- [ ] Cursor pagination: default limit 12, max 50
- [ ] Draft filtering on public reads
- [ ] Files: e.g. `src/list.js`, `src/get.js`, `src/featured.js`, `src/patch.js` — or single `src/photos-api.js` router if cleaner for one zip
- [ ] Export handlers for Lambda entrypoints in package.json / CFN

### Step 4 — Process pipeline changes
- [ ] After optimize + ticket id: build Photo + `putPhoto` (`enrichmentStatus=pending`)
- [ ] Best-effort EventBridge `PutEvents` (`PhotoPendingEnrichment` / agreed source+detail-type)
- [ ] **Remove** GitHub commit path (`lib/github.js` usage from process; stop requiring githubToken in process)
- [ ] Fail closed: no DDB write if optimize or ticket fails
- [ ] Accept `caption` from S3 object metadata (alongside title/featured)
- [ ] File: `src/process.js` (+ init metadata if needed in `src/init.js`)

### Step 5 — Init metadata for caption
- [ ] Extend `upload-url` / init to accept `caption` and pass as S3 metadata (signed headers pattern preserved)
- [ ] File: `src/init.js`

### Step 6 — CloudFormation / IAM
- [ ] Add DynamoDB table `micahwalter-photos` + GSI1 + PITR
- [ ] Add EventBridge bus (or document default-bus source) for enrichment events
- [ ] Add SQS process DLQ + Lambda OnFailure destination for ProcessFn
- [ ] Add API routes for GET/PATCH; wire new handler env (table name, bus name)
- [ ] IAM: DynamoDB + `events:PutEvents`; remove process GitHub permissions if present
- [ ] File: `infra/photo-upload.yml`

### Step 7 — Package / build wiring
- [ ] Ensure Makefile/zip includes new modules; handler names match CFN
- [ ] Update `infra/photo-upload-lambdas/README.md` for new behavior (no git commit; DB + events)

### Step 8 — Docs in aidlc construction summary (markdown only under aidlc-docs)
- [ ] Write `aidlc-docs/construction/u1-photo-data-plane/code/code-summary.md` (what changed, how to deploy/smoke)
- [ ] Note: no automated test runner in repo — document manual/API smoke checklist instead of inventing a test framework

### Step 9 — Local verification (as far as environment allows)
- [ ] Syntax-check / package install in `photo-upload-lambdas` if needed
- [ ] Validate CFN template with `aws cloudformation validate-template` if credentials available; otherwise note deferred
- [ ] Do **not** require full AWS deploy in this agent unless user asks

---

## Out of scope for this plan (later units)

- Enrichment consumer (U2)
- Next.js UI (U3–U5)
- Galleries (U6)
- Migration / redirects / feeds (U7)
- Dual-write / markdown restore

---

## Approval

Approve this plan to begin Part 2 execution (implementation).
