# Photo Map Privacy — Backfill Notes

## Goal
Rewrite `publicLatitude` / `publicLongitude` for existing photos to **2 decimal places** (~1.1 km) after the enricher deploy that changes `fuzzPublicCoords`.

## Prerequisite
Enrich Lambda code with 2-decimal fuzz is deployed (`photo-upload-deploy.yml` after merge, or manual `make build` + update-function-code).

## Procedure

1. Identify photos with GPS (private `latitude`/`longitude` set, or public coords present).
2. Force re-enrich each id:

```bash
AWS_PROFILE=www aws lambda invoke \
  --function-name photo-upload-enrich \
  --cli-binary-format raw-in-base64-out \
  --payload '{"detail":{"photoId":"<id>","force":true}}' \
  /tmp/enrich-out.json
```

3. Confirm API returns 2-decimal public coords and the detail map has no pin / wider bbox (site deploy for UI).

## Notes
- Force enrich also re-runs reverse geocode and Bedrock (tag rebuild from defaults + geo/AI).
- Enricher falls back to stored private lat/lon if the S3 original is unavailable.
- Site UI changes (area embed) ship with the Next.js deploy; coord precision requires the Lambda + backfill.
