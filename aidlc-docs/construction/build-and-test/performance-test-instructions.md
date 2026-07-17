# Performance Test Instructions — Issues #103 / #104

## Purpose

Personal / low-traffic site. NFRs are **best-effort** (no hard SLO). Light smoke only.

## Soft goals (from U1–U7 NFR)

| Surface | Soft goal |
|---------|-----------|
| Photo list/detail API | Interactive within a couple seconds warm |
| Gallery membership resolve | Modest parallel GETs (3–5) |
| Feed publisher | Completes in minutes for full catalog |
| Migrator | ~44 photos in minutes |

## Optional smoke

```bash
# Time public list (requires network)
curl -s -o /dev/null -w "%{http_code} %{time_total}\n" \
  "https://api.micahwalter.com/photos?limit=12"

curl -s -o /dev/null -w "%{http_code} %{time_total}\n" \
  "https://api.micahwalter.com/photos/featured"
```

## Load / stress

**Not required** for this engagement (personal traffic; no Resiliency extension).

If desired later: k6 script against `GET /photos` with low VUs (1–5) for 1–2 minutes; watch DynamoDB throttles (on-demand should absorb).

## Pass criteria

- No sustained 5xx on smoke curls  
- Feed publisher finishes without timeout (60s Lambda)  
- No requirement to meet p95 latency targets  

## N/A

- Formal JMeter plans  
- Concurrent-user capacity certification  
