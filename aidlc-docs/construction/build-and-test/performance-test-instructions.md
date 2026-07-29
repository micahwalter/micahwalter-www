# Performance Test Instructions — Issue #127

## Applicability

**N/A for formal load testing** in this engagement. Exposure is a weekly single-send + low-traffic personal archive.

## Informal expectations

| Surface | Expectation |
|---------|-------------|
| `GET /exposures/` | Personal traffic; API Gateway throttles already set on stack |
| Sunday orchestrator | One invocation/week; timeout 60s sufficient for small photo catalog |
| Newsletter dispatch | Existing bulk SES path (unchanged capacity assumptions) |

## Optional smoke under light concurrency

```bash
# Parallel list (low N)
for i in $(seq 1 5); do
  curl -sS -o /dev/null -w "%{http_code}\n" 'https://api.micahwalter.com/exposures/' &
done
wait
```

**Expected**: HTTP 200s; no 5xx under tiny parallel load.

No JMeter/k6 suite is required for #127 acceptance.
