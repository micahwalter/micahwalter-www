# Component Dependencies — Issue #127 Exposure

## Dependency matrix

| From \\ To | C1 Photos | C2 Owner API | C3 Edit UI | C4 Archive | C5 Counter | C6 Exp API | C7 Site | C8 Orchestrator | C9 Dispatch | C10 Admin |
|------------|-----------|--------------|------------|------------|------------|------------|---------|-----------------|-------------|-----------|
| C3 Edit UI | | uses | | | | | | | | |
| C2 Owner API | uses | | | | | | | | emit test | uses |
| C8 Orchestrator | uses | | | uses | uses | | | | emit | uses |
| C6 Exp API | | | | uses | | | | | | |
| C7 Site | | | | | | uses | | | | |
| C9 Dispatch | | | | | | | | | | |

## Communication patterns

| Edge | Pattern |
|------|---------|
| Edit UI → Owner API | HTTPS + session token |
| Orchestrator → Photos/Archive/Counter | In-process / AWS SDK DynamoDB |
| Orchestrator → newsletter-bus | EventBridge `PutEvents` |
| Bus → Dispatch | Existing SQS/Lambda pipeline |
| Site → Exp API | HTTPS fetch |
| API mapping | `api.micahwalter.com/exposures` → Exposure Public API Lambda (photo-upload stack) |

## Data flow (production Sunday)

```text
EventBridge
    |
    v
Orchestrator --query--> Photos (candidates)
    |
    +--empty--> SES AdminEmail
    |
    +--pick--> Counter (N)
    |            |
    |            v
    +--------> Archive create (N, photoId, ...)
    |            |
    |            v
    +--------> EventBridge newsletter-bus
    |            |
    |            v
    |         Dispatch --> SES subscribers
    |
    +--------> Photos stamp (sentAt, N)
```

### Text alternative
1. Schedule invokes orchestrator.
2. If no candidates, email AdminEmail and stop.
3. Allocate issue N; write Exposure archive; emit campaign; stamp photo.
4. Dispatch delivers to subscribers asynchronously.

## Stack boundary

```text
photo-upload stack                          newsletter stack
-----------------                          ----------------
Photos DB, Exposures DB, Counter           newsletter-bus
Owner API + Exp Public API                 dispatch Lambda
Orchestrator Lambda + EventBridge rule     AdminEmail param (source of truth)
Edit UI / Site (Next.js)                   subscribers / newsletter_sends
        \---- PutEvents NewsletterSendRequested ----/
```
