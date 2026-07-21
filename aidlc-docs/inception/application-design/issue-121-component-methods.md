# Component Methods — Issue #121

Detailed business rules land in Functional Design. Signatures only here.

## TicketsAllocateFn

### `HandleAllocate(ctx, APIGatewayV2HTTPRequest) → APIGatewayV2HTTPResponse`
- **Purpose**: Allocate next post id for an IAM-authenticated caller
- **Input**: Empty or ignored body; identity comes from API Gateway IAM context
- **Output**: `200 { "id": number }` · `403` if somehow reached without IAM · `500` on DynamoDB failure
- **Notes**: No Bearer header; no passcode. Rely on API Gateway rejecting anonymous calls before invoke when possible

### `NextId(ctx) → int64` (existing `tickets.Client.Next`)
- **Purpose**: Atomic counter increment
- **Shared with**: `tickets-next`

## FrontmatterPostIdPatcher

### `listCandidates(prFiles) → PostCandidate[]`
- **Input**: List of added file paths from the PR diff
- **Output**: Candidates under `content/posts/**/index.md` that are blog/email and lack `id`

### `isBlogOrEmail(frontmatter) → bool`
- **Input**: Parsed frontmatter
- **Output**: `false` if `type === 'photo'`; otherwise treat as blog/email (including missing `type`)

### `applyId(filePath, id) → void`
- **Purpose**: Insert `id: N` into YAML frontmatter without clobbering other fields
- **Idempotent**: No-op if `id` already present

## PostIdAllocateWorkflow

### `run()`
1. Checkout PR head ref with token that can push
2. Diff base…head for added `index.md` under `content/posts/`
3. For each candidate without id: `allocate()` then `applyId`
4. If any files changed: commit + push once
5. Exit non-zero on failure

### `allocate() → number`
- AWS SDK / curl SigV4 `POST https://api.micahwalter.com/tickets/allocate`
- Credentials from OIDC-assumed role
