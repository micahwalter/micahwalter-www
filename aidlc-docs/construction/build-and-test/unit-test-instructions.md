# Unit Test Execution — Issues #103 / #104

## Status

This repo has **no automated unit test runner** (`npm test` / Jest / etc. not configured). PBT extension is **disabled**.

Validation for U1–U7 is:

1. Typecheck + production build (`npm run build`)
2. Manual / script dry-runs
3. Live API smoke after deploy (see integration instructions)

## Local correctness checks (stand-in for unit tests)

```bash
# Site compile + static export
NEXT_PUBLIC_PHOTO_API_URL=https://api.micahwalter.com/photos npm run build

# Lambda package builds
cd infra/photo-upload-lambdas && make build && cd ../..

# Migrator dry-runs (no AWS writes)
node scripts/migrate-photos.js
node scripts/migrate-galleries.js
node scripts/cleanup-photo-content.js
```

## Expected results

| Check | Expected |
|-------|----------|
| `npm run build` | Exit 0 |
| `migrate-photos.js` dry-run | Lists ~44 photo folders |
| `migrate-galleries.js` dry-run | Lists gallery folders under `content/galleries` |
| `make build` | `dist/photo-upload.zip` created |

## If checks fail

1. Fix TypeScript / import errors shown by Next build  
2. Fix script syntax (avoid `*/` inside block comments)  
3. Re-run until green  

## Future (optional)

Add Jest/Vitest for `lib/photos-api.ts` helpers and Lambda pure functions if desired — out of scope for this engagement.
