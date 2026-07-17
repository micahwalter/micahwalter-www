# Build Instructions — photo-ux-polish

## Prerequisites
- **Build tool**: Node.js 20+ / npm
- **Dependencies**: `npm install` at repo root
- **Environment**: `NEXT_PUBLIC_PHOTO_API_URL=https://api.micahwalter.com/photos` (optional for build; required for live API pages in browser)
- **System**: Standard Linux/macOS; no AWS required for static build

## Build Steps

### 1. Install Dependencies
```bash
cd /workspace   # or repo root
npm install
```

### 2. Configure Environment (local preview)
```bash
# .env.local
NEXT_PUBLIC_PHOTO_API_URL=https://api.micahwalter.com/photos
NEXT_PUBLIC_CDN_URL=https://…   # if images needed
```

### 3. Build
```bash
npm run build
```

### 4. Verify Build Success
- **Expected**: Next.js static export completes; routes include `/`, `/photos`, `/photos/[id]`, `/galleries`, `/galleries/[slug]`
- **Artifacts**: `/out` directory
- **Note**: Do not commit `public/mastodon.json` if rewritten by prebuild fetch

## Troubleshooting
- **Missing PHOTO_API_URL**: Build may still succeed; client pages error at runtime without the env var baked in (CI sets the secret)
- **Lint**: `npm run lint` is not configured non-interactively; use build as the correctness signal
