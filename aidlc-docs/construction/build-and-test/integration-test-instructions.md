# Integration Test Instructions — Issue #127 Exposure

Manual end-to-end checks after photo-upload stack + site deploy.

## Prerequisites

- Stack `micahwalter-photo-upload` updated with U1–U3 resources  
- Newsletter stack healthy (`newsletter-bus` + dispatch)  
- Site with `/upload` and `/exposures`  
- `NEXT_PUBLIC_PHOTO_API_URL` pointing at live photos API  
- SSO: `aws sso login --profile www`

## Scenario 1 — Eligibility + test send (U1)

1. Open `/upload`, unlock with passcode  
2. Edit a **non-draft** photo → enable **Eligible for Exposure** → Save  
3. Click **Send test Exposure**  
4. Confirm inbox at `AdminEmail` receives test mail (subject `Test · Exposure · …`)  
5. Confirm DynamoDB photo has **no** `exposureSentAt` after test  

**Expected**: Single-recipient test via newsletter dispatch; no subscriber blast; no stamp.

## Scenario 2 — Archive API empty (U2)

```bash
curl -sS 'https://api.micahwalter.com/exposures/' | jq .
```

**Expected**: `{ "items": [], "cursor": null, ... }` (or existing items if already sent).

Open `/exposures` — empty state or list renders without error.

## Scenario 3 — Orchestrator with inventory (U3)

1. Ensure ≥1 public photo with `exposureEligible: true` and no `exposureSentAt`  
2. **Note**: invoke consumes the NY calendar-day lock  

```bash
AWS_PROFILE=www aws lambda invoke \
  --function-name photo-upload-exposure-orchestrator \
  --cli-binary-format raw-payload \
  --payload '{}' \
  /tmp/exposure-out.json
cat /tmp/exposure-out.json
```

3. Confirm response has `issueNumber` + `photoId`  
4. `GET /exposures/{n}` and site `/exposures/{n}` show the photo  
5. Photo record has `exposureSentAt` + `exposureIssueNumber`  
6. Subscribers receive campaign (or check dispatch CloudWatch / SES)  

**Expected**: One Exposure issue; subject `Exposure #N · {title}`; view-in-browser URL `/exposures/N`.

## Scenario 4 — Empty pool notify

1. Clear eligibility or ensure no unsent eligible photos  
2. Delete daily lock item `LOCK#YYYY-MM-DD` (America/New_York date) from counter table if retesting same day  
3. Invoke orchestrator  

**Expected**: `{ empty: true }`; AdminEmail receives “no eligible photos” mail; no new Exposure row.

## Scenario 5 — Idempotent same-day skip

1. Invoke orchestrator twice the same NY day  

**Expected**: Second call `{ skipped: "already-ran" }`; no second issue.

## Cleanup

- Prefer not deleting production Exposure rows  
- To retest lock: remove `LOCK#…` from `micahwalter-exposure-counter` only in intentional test windows
