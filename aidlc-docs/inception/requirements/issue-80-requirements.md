# Requirements — Issue #80: Newsletter Confirmation Rate

**Engagement**: Implementation of [GitHub Issue #80](https://github.com/micahwalter/micahwalter-www/issues/80)  
**Date**: 2026-07-06  
**Depth**: Standard

## Intent

Improve newsletter double opt-in confirmation rate and measurement accuracy by fixing email authentication gaps, adding SES delivery observability, correcting Fathom analytics inflation from bot submissions, and reducing UX friction on the resend path.

## Verification Baseline (2026-07-06)

AWS verification confirmed:

| Finding | Evidence |
|---------|----------|
| Analytics inflation | 46 honeypot + 34 genuine signups in 1 year; Fathom fires on all `202` responses |
| Real confirm rate | 14 confirms / 35 confirmation emails ≈ 40% |
| Apparent confirm rate | 14 / 81 Fathom-eligible responses ≈ 17% |
| Email auth gap | SPF apex = iCloud only; no DMARC; no custom MAIL FROM |
| No delivery events | No SES Configuration Set on send paths |
| DLQ healthy | `email-send-dlq` depth = 0 |

## Functional Requirements

### FR-1: SES custom MAIL FROM subdomain

- Add `bounce.micahwalter.com` (parameterized) as SES custom MAIL FROM
- Create MX + SPF TXT records on the subdomain in Route 53 (primary stack)
- Configure matching `MailFromAttributes` on SES identities in us-east-1 and us-east-2
- Do **not** modify apex SPF used for personal iCloud mail

### FR-2: DMARC monitor mode

- Add `_dmarc.micahwalter.com` TXT record: `p=none`, aggregate reports to `micah@micahwalter.com`
- Use relaxed alignment (`adkim=r; aspf=r`)

### FR-3: SES Configuration Set + CloudWatch events

- Create configuration set `newsletter` with event destination for send, delivery, bounce, complaint, reject
- Wire into `newsletter-email` and `newsletter-dispatch` Lambda send calls
- Tag sends with `messageType=newsletter` for CloudWatch dimensions

### FR-4: Accurate Fathom signup goal

- Subscribe Lambda sets `X-Newsletter-Queued: true` only when a confirmation email is actually queued (new signup)
- Frontend fires Fathom `"Newsletter Signup"` only when that header is present
- Bot/honeypot drops keep identical `202` body and timing (no header)
- Emit CloudWatch metric `Newsletter/Subscribe` → `BotDropped` and `SignupQueued`

### FR-5: Resend confirmation UX

- Check-inbox page: resend action using email/name from sessionStorage
- Expired confirm link page: resend form with email input
- Resend reuses existing subscribe API (server-side resend for PENDING subscribers)

## Non-Functional Requirements

- **Security**: Bot-detection behavior unchanged externally; no new information leakage to bots
- **Deployability**: Changes deploy via existing newsletter GitHub Actions workflow
- **Observability**: CloudWatch metrics for subscribe funnel; SES events for delivery health

## Out of Scope

- Tightening DMARC policy beyond `p=none` (future observation period)
- Apex SPF changes for Amazon SES
- Re-measurement campaign (post-deploy manual step)

## Traceability

| Requirement | Primary artifacts |
|-------------|-------------------|
| FR-1, FR-2, FR-3 | `infra/newsletter.yml`, `infra/newsletter-secondary.yml` |
| FR-4 | `infra/newsletter-lambdas/cmd/subscribe/`, `app/newsletter/SubscribeForm.tsx` |
| FR-5 | `app/newsletter/ResendConfirmation.tsx`, check-inbox, confirm pages |
