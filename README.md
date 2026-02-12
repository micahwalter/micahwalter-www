# Micah Walter's Website

Static website hosted on AWS using S3 and CloudFront with automated CI/CD.

## Architecture

- **S3 Bucket**: Static file storage with versioning enabled
- **CloudFront**: Global CDN with HTTPS
- **CloudFront Function**: SPA routing support
- **Access Logging**: Both S3 and CloudFront logs enabled
- **GitHub Actions**: Automated deployment pipeline with OIDC authentication

## Quick Start

### Automated Deployment (Recommended)

Simply push changes to the `main` branch and GitHub Actions will automatically deploy:

```bash
# Make changes to files in src/
echo "Updated content" > src/index.html

# Commit and push
git add .
git commit -m "Update website content"
git push
```

GitHub Actions will:
1. Sync files to S3 with optimized caching headers
2. Invalidate CloudFront cache
3. Deploy changes globally in ~2 minutes

### Manual Deployment Trigger

```bash
# Trigger deployment manually via GitHub CLI
gh workflow run deploy.yml

# Or via the GitHub web interface:
# https://github.com/micahwalter/micahwalter-www/actions/workflows/deploy.yml
```

### Monitor Deployments

```bash
# View recent deployments
gh run list --workflow=deploy.yml

# Watch current deployment
gh run watch

# View detailed logs
gh run view --log
```

## Infrastructure Setup

### Prerequisites

- AWS CLI installed and configured
- AWS profile `www` set up with appropriate permissions
- GitHub CLI (optional, for workflow management)

### Initial Infrastructure Deployment

```bash
# Deploy main infrastructure (S3, CloudFront)
aws cloudformation create-stack \
  --stack-name micahwalter-www \
  --template-body file://infra/infra.yml \
  --profile www \
  --region us-east-1

# Deploy GitHub Actions OIDC role
aws cloudformation create-stack \
  --stack-name micahwalter-www-github-actions \
  --template-body file://infra/github-actions-role.yml \
  --capabilities CAPABILITY_NAMED_IAM \
  --profile www \
  --region us-east-1

# Wait for completion (5-15 minutes)
aws cloudformation wait stack-create-complete \
  --stack-name micahwalter-www \
  --profile www \
  --region us-east-1

# Get the IAM role ARN for GitHub Actions
aws cloudformation describe-stacks \
  --stack-name micahwalter-www-github-actions \
  --profile www \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`RoleArn`].OutputValue' \
  --output text

# Add the role ARN as a GitHub secret
gh secret set AWS_ROLE_ARN --body "<role-arn-from-above>"
```

## Current Deployment

- **CloudFront URL**: https://d23gkuvfx56704.cloudfront.net
- **Distribution ID**: E1SZIKPZ79BHDU
- **Website Bucket**: micahwalter-www-website
- **Logs Bucket**: micahwalter-www-logs

## Features

### Infrastructure
- ✅ HTTPS enabled (TLS 1.2+)
- ✅ HTTP/2 and HTTP/3 support
- ✅ Global edge locations (PriceClass_All)
- ✅ SPA routing (paths without extensions route to index.html)
- ✅ Gzip/Brotli compression
- ✅ S3 versioning (365-day retention)
- ✅ AES256 encryption at rest
- ✅ Access logging for S3 and CloudFront
- ✅ Optimized caching policy

### CI/CD
- ✅ Automated deployment on push to `main`
- ✅ GitHub Actions workflow with OIDC authentication
- ✅ Smart caching: static assets cached for 1 year, HTML revalidated
- ✅ Automatic CloudFront cache invalidation
- ✅ Manual deployment trigger option
- ✅ No long-lived AWS credentials stored

## Security

- Origin Access Control (OAC) for secure S3 access
- Public access blocked on all buckets
- CloudFront serves all content over HTTPS
- Viewer protocol policy redirects HTTP to HTTPS
- GitHub Actions uses OIDC (no stored credentials)
- IAM role with least-privilege permissions

## Cost Optimization

- Standard S3 replication removed (simplified architecture)
- Log lifecycle policy (90-day retention)
- Version lifecycle policy (365-day retention)
- AES256 encryption (no KMS costs)

## Management Commands

### Update Infrastructure

```bash
# Update main infrastructure stack
aws cloudformation update-stack \
  --stack-name micahwalter-www \
  --template-body file://infra/infra.yml \
  --profile www \
  --region us-east-1

# Update GitHub Actions role stack
aws cloudformation update-stack \
  --stack-name micahwalter-www-github-actions \
  --template-body file://infra/github-actions-role.yml \
  --capabilities CAPABILITY_NAMED_IAM \
  --profile www \
  --region us-east-1
```

### Manual Deployment (Advanced)

If you need to deploy directly without GitHub Actions:

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

# Download recent CloudFront logs
aws s3 sync s3://micahwalter-www-logs/cloudfront-logs/ ./logs/cloudfront/ \
  --profile www
```

### Delete Stack (Cleanup)

```bash
# Empty buckets first
aws s3 rm s3://micahwalter-www-website --recursive --profile www
aws s3 rm s3://micahwalter-www-logs --recursive --profile www

# Delete stacks
aws cloudformation delete-stack \
  --stack-name micahwalter-www \
  --profile www \
  --region us-east-1

aws cloudformation delete-stack \
  --stack-name micahwalter-www-github-actions \
  --profile www \
  --region us-east-1
```

## License

Private
