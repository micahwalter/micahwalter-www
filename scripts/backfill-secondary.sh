#!/usr/bin/env bash
# scripts/backfill-secondary.sh
#
# Syncs primary S3 buckets (us-east-1) to secondary buckets (us-east-2).
#
# When to run:
#   1. Once immediately after enabling CRR (CRR only replicates objects
#      created/modified AFTER the replication rule is activated).
#   2. Any time you suspect the secondary is out of sync (e.g. after
#      manually deleting objects from the secondary, or after a period
#      where replication was disabled).
#
# Usage:
#   ./scripts/backfill-secondary.sh                  # uses AWS_PROFILE=www
#   AWS_PROFILE=other ./scripts/backfill-secondary.sh

set -euo pipefail

AWS_PROFILE="${AWS_PROFILE:-www}"

# Set these via environment variables or edit below for your deployment
PRIMARY_WEBSITE="${PRIMARY_WEBSITE_BUCKET:?Set PRIMARY_WEBSITE_BUCKET env var}"
SECONDARY_WEBSITE="${SECONDARY_WEBSITE_BUCKET:?Set SECONDARY_WEBSITE_BUCKET env var}"

PRIMARY_IMAGES="${PRIMARY_IMAGES_BUCKET:?Set PRIMARY_IMAGES_BUCKET env var}"
SECONDARY_IMAGES="${SECONDARY_IMAGES_BUCKET:?Set SECONDARY_IMAGES_BUCKET env var}"

echo "==> Backfilling website bucket..."
echo "    s3://${PRIMARY_WEBSITE}/ -> s3://${SECONDARY_WEBSITE}/"
aws s3 sync \
  "s3://${PRIMARY_WEBSITE}/" \
  "s3://${SECONDARY_WEBSITE}/" \
  --profile "${AWS_PROFILE}"

echo ""
echo "==> Backfilling images bucket..."
echo "    s3://${PRIMARY_IMAGES}/ -> s3://${SECONDARY_IMAGES}/"
aws s3 sync \
  "s3://${PRIMARY_IMAGES}/" \
  "s3://${SECONDARY_IMAGES}/" \
  --profile "${AWS_PROFILE}"

echo ""
echo "Backfill complete."
