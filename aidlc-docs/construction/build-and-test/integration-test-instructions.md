# Integration Test Instructions — Issue #85 Ticket Server

## Purpose

Verify the ticket server API, CLI, and photo-upload integration work end-to-end after AWS deploy and seed.

## Prerequisites

1. `micahwalter-tickets` stack deployed (us-east-1)
2. `ticket-server-secrets` populated with real `passcode` and `hmac`
3. Counter seeded: `node scripts/seed-post-counter.js --apply --profile www`
4. `micahwalter-tickets-secondary` deployed (us-east-2)
5. `photo-upload-secrets` includes `ticketsPasscode` matching ticket server passcode

## Scenario 1: API auth + next (curl)

```bash
API=https://api.micahwalter.com/tickets
PASS=<your-passcode>

TOKEN=$(curl -s -X POST "$API/auth" \
  -H 'Content-Type: application/json' \
  -d "{\"passcode\":\"$PASS\"}" | jq -r .token)

curl -s -X POST "$API/next" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json'
```

**Expected:** `{ "id": <integer> }` — unique on each call.

Repeat with invalid passcode → 401. Call `/next` without token → 401.

## Scenario 2: CLI post creation

```bash
blog post:new "Ticket Server Test Post"
```

**Expected:** Prompts for passcode on first use (or uses saved credentials). Post frontmatter includes new `id`. No `content/post-counter` file created.

## Scenario 3: Photo import

```bash
blog photos:import /path/to/test.jpg --dry-run
```

**Expected:** Dry-run shows preview IDs without calling API.

## Scenario 4: Photo web upload

Use `/upload` with a test image after photo-upload stack redeploy.

**Expected:** GitHub commit contains only `content/posts/<folder>/index.md` (no counter file). Commit message includes `#<id>`.

## Scenario 5: Multi-region failover (optional)

With both regional APIs deployed, verify secondary endpoint:

```bash
# Get execute-api URL from CloudFormation outputs in us-east-2
aws cloudformation describe-stacks --stack-name micahwalter-tickets-secondary \
  --region us-east-2 --profile www \
  --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" --output text
```

Auth + next against regional URL should return IDs from the same counter sequence as primary.

## Scenario 6: Concurrent allocation

Run 5 parallel `/next` requests (valid token). All returned IDs must be unique.

```bash
for i in 1 2 3 4 5; do
  curl -s -X POST "$API/next" -H "Authorization: Bearer $TOKEN" &
done
wait
```

## Cleanup

Test posts created during integration testing can be deleted locally and reverted from git before merge to `main`, or left as drafts with `draft: true`.
