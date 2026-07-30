# Unit Test Instructions — Issue #127

## Status

This repo has **no automated unit test runner** for the Next.js app or photo-upload Lambdas (`package.json` has no `test` script). Validation is manual + syntax/typecheck.

## Local checks (required)

```bash
# TypeScript (site)
npx tsc --noEmit -p .

# Lambda handler syntax
node --check infra/photo-upload-lambdas/src/photos-api.js
node --check infra/photo-upload-lambdas/src/exposures-api.js
node --check infra/photo-upload-lambdas/src/exposure-orchestrator.js
node --check infra/photo-upload-lambdas/src/lib/exposure-email.js
node --check infra/photo-upload-lambdas/src/lib/exposures-db.js
node --check infra/photo-upload-lambdas/src/lib/exposure-counter.js
node --check infra/photo-upload-lambdas/src/lib/newsletter-events.js

# Email builder smoke
node -e "
const { buildExposureEmail } = require('./infra/photo-upload-lambdas/src/lib/exposure-email.js');
const r = buildExposureEmail({ id: 1, title: 'T', folderName: 'f', coverImageKey: 'images/posts/f/photo.jpg' }, { isTest: true });
if (!r.subject.includes('Test')) process.exit(1);
console.log('ok', r.subject);
"
```

## Expected

- `tsc` exit 0  
- All `node --check` exit 0  
- Email smoke prints `ok Test · Exposure · T`

## Future (optional)

- Jest/Vitest for `buildExposureEmail` / candidate filter helpers  
- Table-driven tests for orchestrator lock + empty-pool branches with mocked AWS SDK
