# Services — Issue #127 Exposure

Orchestration patterns across components.

## S1 — Mark Eligible (owner)

```
Photo Edit UI → PATCH /photos/{id} { exposureEligible }
  → Photo Owner API → Photo Metadata Store
```

## S2 — Test Exposure (owner)

```
Photo Edit UI → POST …/exposure-test (auth)
  → Photo Owner API
      → load photo
      → build HTML/text (title + optional caption; link /photos/{id})
      → subject may include Test prefix + title (or Exposure preview)
      → emit NewsletterSendRequested with testEmail=AdminEmail
         OR send single SES message to AdminEmail
  → no counter allocate, no archive create, no photo stamp
```

Preferred: reuse `NewsletterSendRequested` + `testEmail` so dispatch behavior matches production footers where applicable.

## S3 — Scheduled Production Send (Sunday 09:00 America/New_York)

```
EventBridge schedule
  → Exposure Send Orchestrator
      → listExposureCandidates()
      → if empty: notifyEmptyPool(AdminEmail); exit
      → N = allocateNextIssueNumber()
      → buildEmail(photo, N)
      → createExposure({ issueNumber: N, photoId, … })
      → emit NewsletterSendRequested {
            emailId: N,  // or agreed mapping
            slug/title/bodies,
            viewInBrowserUrl: https://www.micahwalter.com/exposures/N
         }
      → stamp photo { exposureSentAt, exposureIssueNumber: N }
```

**Ordering note (Functional Design):** Choose stamp-after-emit vs stamp-after-dispatch-ack carefully for idempotency; document exact rule in Construction.

## S4 — Subscriber Delivery (existing)

```
newsletter-bus NewsletterSendRequested
  → newsletter-dispatch
      → ACTIVE subscribers / newsletter_sends idempotency
      → SES bulk
```

## S5 — Browse Archive (visitor)

```
/exposures or /exposures/[n]
  → Exposure Site UI
      → GET api.micahwalter.com/exposures[/n]
          → Exposure Public API → Exposure Archive Store
```

## Cross-cutting

| Concern | Approach |
|---------|----------|
| Auth | Existing photo passcode session for owner PATCH + test |
| Public reads | Unauthenticated GET on exposures API |
| Admin address | Newsletter `AdminEmail`; photo stack must receive same value (shared param/secret/env wiring in Infra Design) |
| No CLI | Owner never uses `blog email:send` for Exposure |
