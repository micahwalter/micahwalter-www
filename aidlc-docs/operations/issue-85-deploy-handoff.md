# Operations Handoff — Issue #85 Ticket Server

**Status:** Ready for production deploy  
**PR:** [#86](https://github.com/micahwalter/micahwalter-www/pull/86)  
**Branch:** `cursor/ticket-server-go-065a`

## Pre-merge note

`main` had `content/post-counter` at **148** (new photo post merged). After deploy, seed DynamoDB to **148** so the next ID is **149**.

```bash
node scripts/seed-post-counter.js        # preview (should show 148 from frontmatter)
node scripts/seed-post-counter.js --apply --profile www
```

## Deploy checklist

### 1. Merge PR #86

Resolve any remaining conflicts; merge to `main`.

### 2. IAM (one-time, before first ticket CI deploy)

```bash
AWS_PROFILE=www aws cloudformation deploy \
  --stack-name micahwalter-www-github-actions \
  --template-file infra/github-actions-role.yml \
  --region us-east-1 \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    HostedZoneId=<hosted-zone-id> \
    WebsiteBucketName=<website-bucket> \
    CloudFrontDistributionId=<distribution-id>
```

This attaches `GitHubActionsDeployTickets` managed policy.

### 3. Ticket server primary (us-east-1)

Push to `main` triggers `tickets-deploy.yml`, or deploy manually:

```bash
cd infra/ticket-lambdas
make build upload deploy
```

### 4. Populate secrets

```bash
AWS_PROFILE=www aws secretsmanager put-secret-value \
  --secret-id ticket-server-secrets \
  --secret-string '{"passcode":"<choose>","hmac":"<random 32+ chars>"}'
```

### 5. Seed DynamoDB counter

```bash
node scripts/seed-post-counter.js --apply --profile www
# Type YES when prompted
```

### 6. Ticket server secondary (us-east-2)

```bash
cd infra/ticket-lambdas
make upload-secondary deploy-secondary
```

Or re-run GitHub Actions after pushing `tickets-secondary.yml`.

### 7. Photo upload integration

Add ticket passcode to photo-upload secrets:

```bash
AWS_PROFILE=www aws secretsmanager put-secret-value \
  --secret-id photo-upload-secrets \
  --secret-string '{"passcode":"...","hmac":"...","githubToken":"...","ticketsPasscode":"<same as ticket server passcode>"}'
```

Redeploy photo-upload stack (push to `main` if `photo-upload.yml` changed, or manual CF deploy).

### 8. Smoke tests

Follow `aidlc-docs/construction/build-and-test/integration-test-instructions.md`:

- [ ] `curl` auth + next on `api.micahwalter.com/tickets`
- [ ] `blog post:new` allocates ID
- [ ] Web photo upload commits without counter file
- [ ] Secondary region API returns sequential IDs

## Monitoring

CloudWatch alarms (auto-created):

- `tickets-auth-fn-errors` (us-east-1)
- `tickets-next-fn-errors` (us-east-1)
- `tickets-auth-fn-errors-secondary` (us-east-2)
- `tickets-next-fn-errors-secondary` (us-east-2)

## Rollback

1. Revert PR #86 on `main`
2. Read current DynamoDB counter value
3. Restore `content/post-counter` with that value if reverting to file-based allocation

## Known limitation

If us-east-1 is unavailable, ID allocation fails even when API serves from us-east-2.
