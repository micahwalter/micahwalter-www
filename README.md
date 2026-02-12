# Micah Walter's Website

Static website hosted on AWS using S3 and CloudFront.

## Architecture

- **S3 Bucket**: Static file storage with versioning enabled
- **CloudFront**: Global CDN with HTTPS
- **CloudFront Function**: SPA routing support
- **Access Logging**: Both S3 and CloudFront logs enabled

## Deployment

### Prerequisites

- AWS CLI installed and configured
- AWS profile `www` set up with appropriate permissions

### Deploy Infrastructure

```bash
# Validate the CloudFormation template
aws cloudformation validate-template \
  --template-body file://infra/infra.yml \
  --profile www

# Deploy the stack
aws cloudformation create-stack \
  --stack-name micahwalter-www \
  --template-body file://infra/infra.yml \
  --profile www \
  --region us-east-1

# Wait for completion (5-15 minutes)
aws cloudformation wait stack-create-complete \
  --stack-name micahwalter-www \
  --profile www \
  --region us-east-1
```

### Deploy Website Content

```bash
# Upload files to S3
aws s3 sync src/ s3://micahwalter-www-website/ \
  --delete \
  --profile www

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E1SZIKPZ79BHDU \
  --paths "/*" \
  --profile www
```

## Current Deployment

- **CloudFront URL**: https://d23gkuvfx56704.cloudfront.net
- **Distribution ID**: E1SZIKPZ79BHDU
- **Website Bucket**: micahwalter-www-website
- **Logs Bucket**: micahwalter-www-logs

## Features

- ✅ HTTPS enabled (TLS 1.2+)
- ✅ HTTP/2 and HTTP/3 support
- ✅ Global edge locations (PriceClass_All)
- ✅ SPA routing (paths without extensions route to index.html)
- ✅ Gzip/Brotli compression
- ✅ S3 versioning (365-day retention)
- ✅ AES256 encryption at rest
- ✅ Access logging for S3 and CloudFront
- ✅ Optimized caching policy

## Security

- Origin Access Control (OAC) for secure S3 access
- Public access blocked on all buckets
- CloudFront serves all content over HTTPS
- Viewer protocol policy redirects HTTP to HTTPS

## Cost Optimization

- Standard S3 replication removed (simplified architecture)
- Log lifecycle policy (90-day retention)
- Version lifecycle policy (365-day retention)
- AES256 encryption (no KMS costs)

## Management Commands

### Update Infrastructure

```bash
# Update stack
aws cloudformation update-stack \
  --stack-name micahwalter-www \
  --template-body file://infra/infra.yml \
  --profile www \
  --region us-east-1
```

### View Logs

```bash
# List CloudFront logs
aws s3 ls s3://micahwalter-www-logs/cloudfront-logs/ \
  --profile www \
  --recursive

# List S3 access logs
aws s3 ls s3://micahwalter-www-logs/s3-access-logs/ \
  --profile www \
  --recursive
```

### Delete Stack (cleanup)

```bash
# Empty buckets first
aws s3 rm s3://micahwalter-www-website --recursive --profile www
aws s3 rm s3://micahwalter-www-logs --recursive --profile www

# Delete stack
aws cloudformation delete-stack \
  --stack-name micahwalter-www \
  --profile www \
  --region us-east-1
```

## License

Private
