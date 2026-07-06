# Construction Summary — Issue #80

**Date**: 2026-07-06  
**Issue**: [#80](https://github.com/micahwalter/micahwalter-www/issues/80)

## What Was Built

### Email authentication (infra)

| Resource | Purpose |
|----------|---------|
| `bounce.micahwalter.com` MX + SPF | SES custom MAIL FROM with aligned SPF |
| `_dmarc.micahwalter.com` TXT | DMARC monitor mode (`p=none`) |
| `MailFromAttributes` on SES identity | Envelope sender alignment (both regions) |

Apex SPF (`include:icloud.com`) unchanged.

### Delivery observability (infra + Lambda)

| Resource | Purpose |
|----------|---------|
| SES configuration set `newsletter` | Per-message event tracking |
| CloudWatch event destination | send / delivery / bounce / complaint / reject |
| `CONFIGURATION_SET_NAME` on email + dispatch Lambdas | All outbound SES sends tagged |

### Analytics accuracy (Lambda + frontend)

| Change | Behavior |
|--------|----------|
| `X-Newsletter-Queued: true` header | Set only on genuinely queued new signups |
| `SubscribeForm` | Fathom goal fires only when header present |
| CloudWatch `Newsletter/Subscribe` | `SignupQueued`, `BotDropped` counters |

Bot submissions still receive identical `202` responses without the header.

### Resend UX (frontend)

| Page | Change |
|------|--------|
| `/newsletter/check-inbox` | Resend button using sessionStorage email/name |
| `/newsletter/confirm` (expired) | Resend form with email input |
| `ResendConfirmation` | Shared client component; reuses subscribe API |

## Files Changed

**Infrastructure**

- `infra/newsletter.yml`
- `infra/newsletter-secondary.yml`
- `infra/github-actions-role.yml`

**Go Lambdas**

- `infra/newsletter-lambdas/cmd/subscribe/main.go`
- `infra/newsletter-lambdas/cmd/email/main.go`
- `infra/newsletter-lambdas/cmd/dispatch/main.go`
- `infra/newsletter-lambdas/internal/metrics/metrics.go`
- `infra/newsletter-lambdas/go.mod`, `go.sum`

**Frontend**

- `app/newsletter/SubscribeForm.tsx`
- `app/newsletter/ResendConfirmation.tsx` (new)
- `app/newsletter/check-inbox/page.tsx`
- `app/newsletter/confirm/ConfirmHandler.tsx`

## Build Verification

- Go Lambdas: `make build` in `infra/newsletter-lambdas` — passed

## Deploy Notes

Push to `main` triggers:

1. **Newsletter workflow** — Lambda build + CloudFormation (template changed)
2. **Site deploy workflow** — static export with frontend changes

After deploy, re-run verification checklist in `issue-80-execution-plan.md`.
