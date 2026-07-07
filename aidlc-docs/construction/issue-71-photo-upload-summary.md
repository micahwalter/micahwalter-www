# Issue #71 — Photo Upload Construction Summary

**GitHub Issue**: [#71](https://github.com/micahwalter/micahwalter-www/issues/71)  
**Pull Request**: [#73](https://github.com/micahwalter/micahwalter-www/pull/73)  
**Completed**: 2026-07-07

## Delivered

- Web upload form at `/upload` (passcode gate, title, featured toggle)
- `featured` frontmatter + `getFeaturedPhoto()` for homepage hero
- Serverless backend: `photo-upload-auth`, `photo-upload-init`, `photo-upload-process` Lambdas
- CloudFormation stack `micahwalter-photo-upload`
- CI workflow `.github/workflows/photo-upload-deploy.yml`
- CLI parity: `blog photos:import --featured`

## Review / deploy fixes applied during testing

| Issue | Fix |
|-------|-----|
| Process Lambda committed `index.mdx` | Changed to `index.md` (repo convention) |
| `PhotoApiStage` RouteSettings before routes exist | Added `DependsOn: [AuthRoute, InitRoute]` |
| S3 presigned PUT 403 (unsigned metadata headers) | `unhoistableHeaders` + `signableHeaders` in `init.js` |
| Local dev CORS blocked | Added `http://localhost:3000` to API + uploads bucket CORS |
| GitHub Actions IAM inline policy 10 KB limit | Moved photo-upload permissions to managed policy `GitHubActionsDeployPhotoUpload` |

## Production setup checklist

- [x] Deploy `micahwalter-photo-upload` stack
- [x] Populate `photo-upload-secrets` (passcode, hmac, githubToken)
- [ ] Set GitHub Actions secret `NEXT_PUBLIC_PHOTO_API_URL`
- [ ] Redeploy IAM stack with managed policy (enables CI photo-upload deploys)
- [x] End-to-end upload tested from local dev

## Key paths

- Frontend: `app/upload/`
- Lambdas: `infra/photo-upload-lambdas/`
- Infra: `infra/photo-upload.yml`
- Docs: `README.md` (Web Photo Upload), `CLAUDE.md` (Photo Upload section), `AGENTS.md`
