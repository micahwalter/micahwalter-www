# AGENTS.md

This repository is a personal static blog built with Next.js 15 (App Router), TypeScript, and Tailwind CSS. Content is authored as MDX under `content/posts/**/index.mdx`. See `README.md` and `CLAUDE.md` for full architecture, content model, and the `blog` CLI reference.

## Cursor Cloud specific instructions

Dependencies (`npm install`) are refreshed automatically on startup. Notes below cover non-obvious caveats for running/validating the app in this environment.

### Running the app
- Dev server: `npm run dev` (Next.js + Turbopack on http://localhost:3000). `next dev` does NOT run the `prebuild` scripts, so it starts without any network/AWS access.
- `next.config.ts` only enables static export (`output: "export"`) when `NODE_ENV === "production"`. In dev all routes are reachable without being listed in `generateStaticParams`, and `draft: true` posts are visible (they are hidden in production builds).

### Build
- `npm run build` works offline. Its `prebuild` step runs `scripts/fetch-mastodon.js`, which calls `micah.social`; on failure it logs a warning and keeps the existing `public/mastodon.json`, so the build still succeeds. The fetch may rewrite `public/mastodon.json` — treat that as a build artifact and do not commit it.

### Lint
- `npm run lint` (`next lint`) is NOT configured in this repo and prompts for interactive ESLint setup, so it cannot run non-interactively. Lint is also not part of CI (`.github/workflows/deploy.yml` only runs `npm run build`). Use a successful `npm run build` as the primary correctness signal.

### Tests
- There are no automated tests (no test runner, no `test` script). Validate changes by running the dev server and checking pages, plus `npm run build`.

### Images / AWS features are optional for local dev
- Post images are stored in S3/CDN and are NOT in the repo, so they render as broken image placeholders locally. This is expected. Pulling them requires AWS credentials (`blog images:download --profile www`). AWS-backed features (newsletter API, image upload, analytics, SES Lambdas under `infra/`) are not needed to run or develop the site UI locally.

### Content authoring caveat
- `scripts/create-post.js` (`blog post:new`) is interactive via stdin prompts and does not work when stdin is piped/non-interactive. To create a post programmatically, write `content/posts/YYYY-MM-DD-<slug>/index.mdx` directly (frontmatter shape is in `CLAUDE.md`) and increment `content/post-counter`. The dev server hot-reloads new posts at `/posts/<slug>`.
