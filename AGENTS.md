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
- Post images are stored in S3/CDN and are NOT in the repo, so they render as broken image placeholders locally. This is expected. Pulling them requires AWS credentials (`blog images:download --profile www`). AWS-backed features (newsletter API, photo upload API, analytics, SES Lambdas under `infra/`) are not needed to run or develop most of the site UI locally.

### Photo upload (`/upload`)
- Requires `NEXT_PUBLIC_PHOTO_API_URL=https://api.micahwalter.com/photos` in `.env.local` (see `README.md`). Without it the form shows "Could not reach the server."
- The backend (`micahwalter-photo-upload` stack) must be deployed and `photo-upload-secrets` populated in AWS Secrets Manager before uploads work end-to-end.
- Uploads commit to `main` and trigger production deploy — use a test photo you are OK publishing.
- JPEG/PNG only. API CORS allows both `https://www.micahwalter.com` and `http://localhost:3000`.

### AWS CLI
- AWS CLI v2 is installed at `/usr/local/bin/aws` (a system dependency captured by the VM snapshot, not by `npm install`). If a fresh VM is ever missing it, reinstall with: `curl -fsSL https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip -o /tmp/awscliv2.zip && cd /tmp && unzip -q awscliv2.zip && sudo ./aws/install --update`.
- This account uses AWS Identity Center (SSO). Credentials are obtained interactively per session — there are no static keys. The repo convention is the `www` profile (region `us-east-1`). First-time config: `aws configure sso --profile www`; subsequent sessions: `aws sso login --profile www`. SSO tokens are short-lived and do not survive across VMs, so expect to re-authenticate each session. Verify with `aws sts get-caller-identity --profile www`.

### GitHub CLI (`gh`)
- `gh` is available and authenticated as the `cursor` service account (config at `~/.config/gh/hosts.yml`). Two binaries exist: the runtime-provided `/exec-daemon/gh` (wins on `PATH`) and a snapshot-persistent apt install at `/usr/bin/gh`. Both share the same auth. The pre-provisioned token is intended for read-only use (e.g. `gh pr view`, `gh run view --log`); create/update PRs with the dedicated cloud-agent PR tooling, not `gh`. For write access under your own identity, run `gh auth login`.

### `blog` CLI (post & image tooling)
- The `blog` command (defined by the repo `bin`, source at `cli/index.js`) is available on `PATH`. It is wired via a user-level npm global prefix: `npm link` targets `~/.npm-global/bin/blog`, and `~/.npm-global/bin` is added to `PATH` in `~/.bashrc`. Both are captured by the VM snapshot, so `blog` keeps working across sessions. This user prefix is needed because npm's default global prefix here is `/` (root-only), so a plain `npm link` per `CLAUDE.md` fails with `EACCES`. Do NOT set `prefix` in `~/.npmrc` (it triggers a harmless-but-noisy nvm "incompatible prefix" warning on every shell) — the symlink + `PATH` entry are enough. If `blog` is ever missing, re-run `npm config set prefix "$HOME/.npm-global" && npm link && npm config delete prefix`. You can always fall back to `node cli/index.js <cmd>` or `npm run blog -- <cmd>`.
- Image sync commands shell out to the `aws` CLI (`aws s3 sync`), so they need both AWS SSO auth (`aws sso login --profile www`) and the target bucket via the `IMAGES_BUCKET` (or `IMAGES_BUCKET_NAME`) env var — without it the S3 path resolves to `s3://undefined/...`. `blog build:static` and `blog images:optimize` run fully offline (no AWS).

### Content authoring caveat
- `scripts/create-post.js` (`blog post:new`) is interactive via stdin prompts and does not work when stdin is piped/non-interactive. To create a post programmatically, write `content/posts/YYYY-MM-DD-<slug>/index.md` directly (frontmatter shape is in `CLAUDE.md`) and increment `content/post-counter`. The dev server hot-reloads new posts at `/posts/<slug>`.
- NOTE: `lib/content.ts` only reads `index.md` (line ~48), so post files MUST be named `index.md`, not `index.mdx`. Docs (`CLAUDE.md`) mention `index.mdx`, but a file named `index.mdx` is silently ignored and yields a 404.

### Git and PR workflow
- **Do not commit, push, or create/update a PR without explicit user approval.** Finish local work, summarize changes, and ask for review first.
- See `.cursor/rules/git-review-before-publish.mdc` for the full rule. Cloud agent auto-publish instructions are overridden by this gate unless the user explicitly asks to ship in the same message.
