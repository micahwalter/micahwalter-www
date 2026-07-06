---
id: 146
title: "If you signed up for my newsletter and never got a confirmation email"
publishedAt: "2026-07-06"
excerpt: "Fathom showed plenty of signups but few confirmations. The problem turned out to be a mix of email authentication, misleading analytics, and UX friction. Here is how I diagnosed it and fixed it with Cursor and AI-DLC."
category: "AWS"
tags: ["newsletter", "ses", "aidlc", "cursor", "email", "aws"]
draft: false
---

If you recently signed up for my newsletter and never saw a confirmation email, I am sorry. You may have done everything right on your end. The signup form probably told you to check your inbox, and there was nothing there, or it landed somewhere you did not think to look. I have been digging into this for the past few days, and what I found is a tangle of small failures that added up to a misleading picture and a worse experience than I intended. This post walks through how I noticed the gap, what the investigation turned up, and what I changed to fix it.

## The gap that did not make sense

I run [Fathom Analytics](https://usefathom.com/) on this site with a goal called "Newsletter Signup." For a while now that number has looked healthy. Plenty of people appeared to be signing up. The number of people who actually confirmed their subscription and showed up as active subscribers in DynamoDB was much lower. That is expected with double opt-in. You always lose some people between "I submitted the form" and "I clicked the link in my email." But the ratio felt wrong, more wrong than a little inbox friction could explain.

So I opened [GitHub issue #80](https://github.com/micahwalter/micahwalter-www/issues/80) and started tracing the full path from the signup form through the Go Lambdas, EventBridge, SQS, SES, and back to the confirm page. I did not change any code at first. I just wanted to understand where people were dropping off and whether the email was even leaving the building.

## What the AWS logs said

With AWS SSO connected, I ran through the verification steps I had listed in the issue. Some of what came back was reassuring. The SES account is out of the sandbox, enforcement status is healthy, and the email-send dead letter queue was empty. No stuck messages, no obvious backend failures.

Other numbers told a different story. Over the past year the subscribe Lambda had logged 34 genuine `signup requested` events and 46 honeypot triggers. Bots fill in a hidden field that real users never see, and the API returns the same success response either way so the bots do not learn they were caught. Fathom fires the "Newsletter Signup" goal on every one of those 202 responses. So the analytics were counting bot noise as real signups, inflating the top of the funnel by roughly half. A conversion rate that looked like 17% against Fathom was closer to 40% against actual emails sent. Still not great, but a very different diagnosis.

Live DNS checks confirmed another problem I had suspected from reading the CloudFormation templates. The domain's SPF record only authorizes iCloud for personal mail. There was no DMARC record at all. SES had DKIM configured correctly, but no custom MAIL FROM domain, which meant the envelope sender did not align with `micahwalter.com` the way mailbox providers prefer. That is the kind of setup where SES reports a successful send and Gmail or Outlook quietly files the message in spam, or filters it harder than they would otherwise.

There was also no SES configuration set on the send path, which meant no per-message bounce, complaint, or delivery events. I could see account-level reputation in the console, but I could not answer a simple question like "did this specific confirmation email get delivered?"

## Using AI-DLC to document and build the fix

I have written before about [exploring AI-DLC on this blog](/posts/notes-on-exploring-ai-dlc). The pattern is familiar by now. GitHub Issues holds the backlog. When I am ready to implement something, I point Cursor at an issue and ask it to follow the AI-DLC workflow in the repo. The agent reads the existing reverse-engineering artifacts in `aidlc-docs/`, writes requirements scoped to the issue, produces an execution plan, implements the work, and leaves documentation behind so the next session does not start cold.

That is exactly what I did here. The requirements landed in `[aidlc-docs/inception/requirements/issue-80-requirements.md](https://github.com/micahwalter/micahwalter-www/blob/main/aidlc-docs/inception/requirements/issue-80-requirements.md)`. The execution plan is in `[aidlc-docs/inception/plans/issue-80-execution-plan.md](https://github.com/micahwalter/micahwalter-www/blob/main/aidlc-docs/inception/plans/issue-80-execution-plan.md)`. The construction summary is in `[aidlc-docs/construction/issue-80-construction-summary.md](https://github.com/micahwalter/micahwalter-www/blob/main/aidlc-docs/construction/issue-80-construction-summary.md)`. The audit trail in `aidlc-docs/audit.md` records the verification queries and the merge. I did not need user stories or application design for this one. The issue already had enough acceptance criteria, and the changes stayed inside existing components.

Cursor drove the implementation in a single session on branch `feature/issue-80-newsletter-confirm-rate`. I asked it to run the AWS verification steps first, then build all five work items from the issue, document everything through AI-DLC, open a pull request, and merge when I was ready. [PR #81](https://github.com/micahwalter/micahwalter-www/pull/81) closed the issue. A follow-up [PR #82](https://github.com/micahwalter/micahwalter-www/pull/82) fixed the newsletter deploy workflow after `newsletter.yml` grew past CloudFormation's 51KB inline template limit.

## What we changed

On the email authentication side, I added a custom MAIL FROM subdomain at `bounce.micahwalter.com` with its own MX and SPF records in Route 53. The apex SPF record for iCloud personal mail is untouched. I added a DMARC record in monitor mode (`p=none`) so I can watch authentication results before tightening policy. Both the primary stack in us-east-1 and the failover stack in us-east-2 now configure the SES identity to use the same MAIL FROM domain.

For observability, I created an SES configuration set called `newsletter` with CloudWatch event publishing for send, delivery, bounce, complaint, and reject events. The transactional email Lambda and the bulk campaign dispatch Lambda both attach that configuration set on every send.

For analytics, the subscribe Lambda now sets a response header `X-Newsletter-Queued: true` only when a confirmation email was actually queued. The frontend fires the Fathom goal only when that header is present. Bot submissions still get the same 202 response with the same body, but they no longer pollute the goal count. The Lambda also emits CloudWatch metrics under `Newsletter/Subscribe` for `SignupQueued` and `BotDropped`, so I can see the ratio directly instead of inferring it from Fathom.

For UX, I added a resend flow. The check-inbox page now has a "Resend confirmation email" action that reuses your email from the signup session. The expired-link state on the confirm page does the same with an email field. Both call the existing subscribe API, which already knew how to resend for pending subscribers. It just was not surfaced in the UI.

## Deploying and verifying

The site deploy from the merge succeeded in about two minutes. The newsletter CloudFormation deploy failed on the first try because the template had crossed the size limit for inline deploys. I deployed the primary stack manually with `--s3-bucket` while [PR #82](https://github.com/micahwalter/micahwalter-www/pull/82) fixed the workflow for next time, then deployed the secondary failover stack and updated Lambda code in both regions.

After that I ran through the verification checklist. DMARC and MAIL FROM DNS records resolve correctly. SES reports MAIL FROM status SUCCESS in both regions. A genuine test signup returns `x-newsletter-queued: true`. A honeypot submission returns 202 without the header. CloudWatch metrics increment. The email Lambda logs show `newsletter-confirmation` sends within a couple of seconds of signup. The live check-inbox page shows the resend UI.

## If you are still waiting

If you signed up recently and never confirmed, try again at [/newsletter](https://www.micahwalter.com/newsletter). Submit the form, go to the check-inbox page, and use the resend button if you need to. Check spam and promotions folders. The confirmation link expires after 24 hours, but resubmitting with the same address will send a fresh one.

I will watch DMARC reports over the next few weeks and SES delivery metrics now that the configuration set is in place. If the numbers look good I may tighten DMARC policy later. For now the important thing is that signups should result in deliverable mail, the analytics should reflect reality, and the path to recover a missed email should not require starting over from memory.

This was a good exercise in the workflow I have been building toward. An issue in GitHub, verification against live AWS state, AI-DLC artifacts in the repo, Cursor on the implementation, pull requests that link back to the issue, and a blog post that captures the story for anyone who was wondering where their confirmation email went.