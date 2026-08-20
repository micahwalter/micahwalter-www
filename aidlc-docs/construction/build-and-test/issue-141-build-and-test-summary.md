# Build and Test — Issue #141

## Unit tests

From `infra/photo-upload-lambdas`:

```bash
node --test src/lib/photo-api-routes.test.js src/lib/exif.test.js
```

Expected: 12 pass (route matching for `GET /exposure-queue` plus existing EXIF tests).

## Site build

```bash
npx tsc --noEmit
npm run build
```

`/upload` must appear in the route table. `prebuild` may warn on Mastodon fetch; that is non-blocking.

## Manual (owner)

1. After photo-upload stack deploy (template + Lambda code), unlock `/upload`.
2. Open the **Exposures** tab.
3. Upcoming pool should match photos marked Eligible that have not been sent.
4. Already sent should match `/exposures` archive, newest first.
5. A pooled row should open Edit (`/upload?edit={id}`).
6. Unauthenticated `GET https://api.micahwalter.com/photos/exposure-queue` returns 401.

## Deploy note

Merging to `main` runs `photo-upload-deploy.yml` (and secondary) because `infra/photo-upload.yml` and `infra/photo-upload-lambdas/**` changed. The new HTTP route exists only after that CloudFormation deploy.
