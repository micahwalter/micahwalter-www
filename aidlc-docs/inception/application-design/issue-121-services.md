# Services — Issue #121

## TicketAllocationService (machine)

Orchestrates machine ID minting without human credentials.

```
GitHub Actions (OIDC)
  → STS AssumeRole (GitHubActionsDeploy* / dedicated invoke policy)
  → SigV4 POST /tickets/allocate
  → API Gateway AWS_IAM authorizer
  → tickets-allocate Lambda
  → DynamoDB post_tickets (us-east-1)
  → { id }
```

Human/CLI path remains a separate orchestration:

```
blog CLI / local agent
  → POST /tickets/auth { passcode }
  → POST /tickets/next Authorization: Bearer …
  → tickets-next → same DynamoDB counter
```

Both paths share one monotonic counter. Machine path never sees the passcode.

## PostIdBackfillService (one-shot in this engagement)

Same machine allocate call, used to patch the already-published
`content/posts/2026-07-20-photos-without-the-deploy/index.md` (workflow_dispatch or a commit on the implementation branch after stacks are live).

## PublishingOrchestration (author experience)

1. Author/agent adds `content/posts/.../index.md` without local ticket setup
2. Opens PR
3. PostIdAllocateWorkflow commits `id` onto the branch
4. Author flips `draft: false` when ready and merges
