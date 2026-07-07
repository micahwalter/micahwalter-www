---
id: 148
title: "Uploading photos to my blog from my phone"
publishedAt: "2026-07-07"
excerpt: "I wanted to post a photo without opening my laptop. The fix was a passcode-gated form, three Lambdas, and a pipeline that commits to GitHub and triggers the normal deploy. Here is how issue #71 became /upload."
category: "AWS"
tags: ["photo-upload", "lambda", "s3", "aidlc", "cursor", "aws", "github-actions"]
draft: true
---

For years I have added photos to this site the same way: import them on my laptop with the `blog` CLI, optimize and sync to S3, commit the markdown, push to `main`, wait for the deploy. That works fine at a desk. It is less fine when I am out with a camera and the photo I want to share is already on my phone. I opened [GitHub issue #71](https://github.com/micahwalter/micahwalter-www/issues/71) to fix that. The goal was simple. A private form on the site where I enter a passcode, pick a photo, optionally flag it for the homepage, and let the existing static-export model handle the rest. No new runtime server on the blog. No breaking the CLI path. Just the same pipeline, reachable from a browser.

## What I did not want to break

This site is a static export. There are no API routes in the Next.js app at build time. Images live in S3, not in git. Posts are markdown files under `content/posts/`. The `blog photos:import` and `blog images:sync` commands already know how to extract EXIF, resize with Sharp into 400/800/1200 WebP and JPEG variants, upload originals and processed files to the right buckets, and write frontmatter that matches the rest of the archive.

Whatever I built for the phone had to reproduce that pipeline and land in the same places. It also had to trigger a normal deploy. The only durable store for post IDs is `content/post-counter` in the repo, so the web uploader needed to read and bump that counter and commit `index.md` through the GitHub API, same as if I had run the CLI locally.

## The shape of the solution

[PR #73](https://github.com/micahwalter/micahwalter-www/pull/73) added a `noindex` page at `/upload` and a serverless backend mapped to `https://api.micahwalter.com/photos`.

The flow looks like this:

```
/upload form
  → POST /photos/auth        passcode → short-lived HMAC-signed token
  → POST /photos/upload-url  token → presigned S3 PUT URL
  → PUT (direct to S3)       original → micahwalter-photo-uploads/uploads/incoming/…
                                   │ S3 ObjectCreated
                                   ▼
                             photo-upload-process Lambda
                               EXIF → resize → images bucket
                               → commit index.md + bumped post-counter via GitHub API
                               → site rebuilds (~3–4 min)
```

Direct-to-S3 upload matters. Phone photos are multi-megabyte. API Gateway and Lambda are the wrong place to receive the bytes. The init Lambda only mints a presigned PUT URL. Title and "feature on homepage" ride along as S3 object metadata so the processing Lambda does not need a separate datastore.

Three Node.js Lambdas share one deployment zip: **auth** checks the passcode, **init** validates the session token and presigns the upload, **process** runs on the S3 event and does the heavy work. CloudFormation stack `micahwalter-photo-upload` owns the uploads bucket, the secret, the HTTP API, IAM, and a CloudWatch alarm. A new workflow, `photo-upload-deploy.yml`, builds the zip and deploys on pushes to `main`.

On the content side, the PR added a `featured` frontmatter flag and `getFeaturedPhoto()` so the homepage hero is the newest featured photo instead of a hardcoded post ID. The CLI gained `blog photos:import <dir> --featured` for parity with the web form.

## Using AI-DLC and Cursor to get it over the line

The feature was largely implemented before I picked it up for review. [PR #73](https://github.com/micahwalter/micahwalter-www/pull/73) had been open since June. The code looked reasonable in the diff, but it had never been deployed end-to-end in my AWS account. That is the gap I wanted to close, and it is the same pattern I used for the [newsletter confirmation email post](/posts/newsletter-confirmation-emails) last week.

I checked out the branch, merged `main`, and asked Cursor to follow the AI-DLC workflow already in the repo. The agent read the existing brownfield artifacts in `aidlc-docs/`, ran a production build, built the Lambda zip, and started deploying to the account behind the `www` SSO profile. The construction summary landed in [aidlc-docs/construction/issue-71-photo-upload-summary.md](https://github.com/micahwalter/micahwalter-www/blob/main/aidlc-docs/construction/issue-71-photo-upload-summary.md). The audit trail in `aidlc-docs/audit.md` records the session. I did not need a fresh requirements document. Issue #71 and the PR description were enough acceptance criteria, and the work stayed inside existing boundaries.

What followed was less about architecture and more about the unglamorous part of shipping: making the thing actually work when you click the button.

## What broke during testing (and what we fixed)

The first failure was mundane. Local dev showed "Could not reach the server" even with the right passcode. The form needs `NEXT_PUBLIC_PHOTO_API_URL` in `.env.local`, and the API only allowed CORS from production until we added `http://localhost:3000` to the API Gateway and uploads bucket rules.

The second failure was subtler. Auth succeeded, the upload form appeared, and then "Upload failed." CloudWatch on `photo-upload-init` looked fine. The browser PUT to S3 returned 403. S3's error was explicit: metadata headers were present in the request but not signed. The AWS SDK v3 presigner was only signing `host`. Fixing it required `unhoistableHeaders` for the `x-amz-meta-*` fields and `signableHeaders` for `Content-Type` in `init.js`. After redeploying the Lambda zip, uploads returned HTTP 200.

Other fixes were repo hygiene. The process Lambda still committed `index.mdx` while the site had migrated to `index.md`, so posts would have been invisible after upload. CloudFormation failed on first deploy because `PhotoApiStage` referenced `POST /auth` throttling before that route existed; adding `DependsOn` fixed it. The GitHub Actions deploy role hit the 10 KB combined inline policy limit when photo-upload permissions were added, so those permissions moved to a managed policy named `GitHubActionsDeployPhotoUpload`.

## Deploying and wiring production

We deployed `micahwalter-photo-upload` manually first, then merged the PR. Both the site deploy and `photo-upload-deploy.yml` succeeded on the merge commit. I populated `photo-upload-secrets` in Secrets Manager with a passcode, an HMAC signing key, and a fine-grained GitHub PAT scoped to this repo with Contents read/write.

One more gap showed up after I set `NEXT_PUBLIC_PHOTO_API_URL` in GitHub Actions secrets. The deploy workflow passed Fathom and newsletter URLs into the build but not the photo API URL. A one-line fix to `.github/workflows/deploy.yml` and a redeploy baked the value into the static `/upload` page on production.

## Using it

The form lives at [/upload](https://www.micahwalter.com/upload). It is `noindex` and passcode-gated. Pick a JPEG or PNG, optionally set a title and toggle "Feature on homepage," and upload. Within a few minutes you should see a new commit on `main`, a GitHub Actions deploy, and the photo in the feed. If you flagged it, the homepage hero updates to the newest featured photo.

JPEG and PNG only for now. The Lambda's Sharp build has no libheif, so HEIC is a follow-up. In practice iOS Safari often transcodes HEIC to JPEG when you pick from the camera roll, which covers the case I care about most.

## Same workflow, different surface

This was the second issue in a row where the interesting work was not inventing a new architecture but closing the loop between issue, implementation, AWS reality, and documentation. GitHub Issues holds the intent. The PR holds the code. AI-DLC artifacts in `aidlc-docs/` hold the decisions so the next session does not start cold. Cursor on a Cloud Agent VM handled merge conflicts, deploys, log spelunking, and the small fixes that only show up when you actually click upload with a real file.

Issue #71 is closed. The CLI path still works. The phone path now does the same job. That was the whole point.
