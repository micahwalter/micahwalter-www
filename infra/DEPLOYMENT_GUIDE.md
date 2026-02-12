# Infrastructure Deployment Guide

## Overview

This guide covers deploying the updated CloudFormation template that adds a dedicated S3 bucket for optimized blog post images.

## What's New

The updated infrastructure adds:

- **ImagesBucket**: Dedicated S3 bucket for optimized blog post images
- **CloudFront Cache Behavior**: Routes `/images/*` requests to the images bucket
- **Same Security Standards**: Encryption, versioning, logging, OAC, private buckets
- **Lifecycle Policies**: Automatic cleanup of old image versions after 365 days

## Prerequisites

- AWS CLI configured with appropriate credentials
- Existing CloudFormation stack deployed (stack name: likely `micahwalter-www`)
- GitHub repository with GitHub Actions configured

## Deployment Steps

### 1. Update CloudFormation Stack

```bash
cd infra/

# Option A: Using AWS CLI
aws cloudformation update-stack \
  --stack-name micahwalter-www \
  --template-body file://infra.yml \
  --capabilities CAPABILITY_IAM

# Wait for stack update to complete
aws cloudformation wait stack-update-complete \
  --stack-name micahwalter-www

# Option B: Using AWS Console
# 1. Go to CloudFormation console
# 2. Select your stack (micahwalter-www)
# 3. Click "Update"
# 4. Upload infra.yml
# 5. Review changes and confirm
```

### 2. Verify New Resources

Check that the new resources were created:

```bash
aws cloudformation describe-stacks \
  --stack-name micahwalter-www \
  --query 'Stacks[0].Outputs'
```

You should see a new output: **ImagesBucketName** (e.g., `micahwalter-www-images`)

### 3. Update GitHub Actions Environment Variables

Update `.github/workflows/deploy.yml` with the new bucket name:

```yaml
env:
  IMAGES_BUCKET: micahwalter-www-images  # From CloudFormation output
```

**Note**: This is already updated in this PR, but verify the bucket name matches your stack output.

### 4. Update IAM Permissions for GitHub Actions Role

The GitHub Actions role needs permissions to upload to the new images bucket.

Add this policy to your GitHub Actions IAM role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::micahwalter-www-images/*",
        "arn:aws:s3:::micahwalter-www-images"
      ]
    }
  ]
}
```

**Using AWS CLI:**

```bash
# Get the role name from GitHub secrets (AWS_ROLE_ARN)
ROLE_NAME="GitHubActionsRole"  # Replace with your actual role name

# Create policy document
cat > /tmp/images-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::micahwalter-www-images/*",
        "arn:aws:s3:::micahwalter-www-images"
      ]
    }
  ]
}
EOF

# Attach inline policy to role
aws iam put-role-policy \
  --role-name $ROLE_NAME \
  --policy-name ImagesBucketAccess \
  --policy-document file:///tmp/images-policy.json
```

### 5. Upload Existing Images

If you have existing optimized images locally, upload them:

```bash
# Generate optimized images (if not already done)
npm run optimize-images

# Upload to new images bucket
IMAGES_BUCKET=micahwalter-www-images npm run upload-images

# Or manually using AWS CLI
aws s3 sync .optimized-images/posts s3://micahwalter-www-images/images/posts/ \
  --cache-control "public, max-age=31536000, immutable"
```

### 6. Invalidate CloudFront Cache

Force CloudFront to fetch images from the new bucket:

```bash
aws cloudfront create-invalidation \
  --distribution-id E1SZIKPZ79BHDU \
  --paths "/images/*"
```

### 7. Test

1. **Verify images load**: Visit your blog and check that cover images display correctly
2. **Check network tab**: Confirm images are served from CloudFront
3. **Verify WebP**: Modern browsers should load `.webp` files
4. **Check S3**: Verify images are in the new bucket:
   ```bash
   aws s3 ls s3://micahwalter-www-images/images/posts/ --recursive
   ```

## Architecture Changes

### Before

```
CloudFront
  └─ Origin: WebsiteBucket (all content)
```

### After

```
CloudFront
  ├─ Origin: WebsiteBucket (HTML, JS, CSS)
  │    └─ Path: /* (default)
  │
  └─ Origin: ImagesBucket (optimized images)
       └─ Path: /images/* (cache behavior)
```

## Security Features

The new ImagesBucket has the same security standards as WebsiteBucket:

- ✅ **Private**: No public access enabled
- ✅ **Encrypted**: AES256 encryption at rest
- ✅ **Versioned**: Version history enabled (365 day retention)
- ✅ **Logged**: Access logs sent to LogsBucket
- ✅ **OAC**: CloudFront Origin Access Control (not legacy OAI)
- ✅ **HTTPS**: All traffic encrypted in transit
- ✅ **Immutable Cache**: 1-year cache with immutable flag

## Rollback Plan

If issues arise, you can rollback:

```bash
# Rollback CloudFormation stack
aws cloudformation update-stack \
  --stack-name micahwalter-www \
  --template-body file://infra-backup.yml  # Your previous version
```

**Note**: This will delete the ImagesBucket. Make sure to backup images first if needed.

## Cost Impact

**Additional Resources:**
- 1 S3 bucket (ImagesBucket)
- 1 CloudFront Origin Access Control

**Estimated Monthly Cost:**
- S3 storage: 100 posts × 6 images × 100KB = ~60MB = **$0.001/month**
- S3 requests: negligible (only during uploads)
- CloudFront: no additional cost (same distribution)

**Total additional cost: < $0.01/month**

## Troubleshooting

### Images still showing broken after deployment

1. **Check S3**: Verify images exist in bucket
   ```bash
   aws s3 ls s3://micahwalter-www-images/images/posts/2024-01-15-building-ai-agents/
   ```

2. **Check CloudFront cache behavior**: Verify `/images/*` path pattern is configured

3. **Invalidate cache**:
   ```bash
   aws cloudfront create-invalidation --distribution-id E1SZIKPZ79BHDU --paths "/images/*"
   ```

4. **Check browser console**: Look for 403/404 errors

### GitHub Actions failing to upload images

1. **Verify IAM permissions**: Check that GitHub Actions role has S3 permissions for images bucket
2. **Check bucket name**: Ensure `IMAGES_BUCKET` env var matches CloudFormation output
3. **View Actions logs**: Check GitHub Actions logs for specific error messages

### CloudFront returns 403 errors

1. **Check bucket policy**: Verify ImagesBucketPolicy allows CloudFront access
2. **Check OAC**: Ensure CloudFrontImagesOAC is referenced in CloudFront distribution
3. **Wait**: OAC changes can take 5-10 minutes to propagate

## Verification Checklist

After deployment, verify:

- [ ] CloudFormation stack updated successfully
- [ ] New ImagesBucket created (check AWS Console or CLI)
- [ ] CloudFront distribution has two origins
- [ ] Cache behavior for `/images/*` exists
- [ ] IAM role has permissions for images bucket
- [ ] GitHub Actions environment variable updated
- [ ] Existing images uploaded to new bucket
- [ ] CloudFront cache invalidated for `/images/*`
- [ ] Images loading correctly on website
- [ ] Browser network tab shows images from CloudFront
- [ ] WebP images served to modern browsers

## Next Steps

After successful deployment:

1. Monitor CloudWatch logs for any errors
2. Check CloudFront cache hit rate (should be >95% after warmup)
3. Consider enabling CloudFront access logs for images
4. Add more blog posts with images to test the workflow

## Support

If you encounter issues:
- Check CloudFormation Events tab for detailed error messages
- Review CloudWatch Logs for Lambda/CloudFront errors
- Check S3 bucket policies and IAM permissions
- Verify GitHub Actions logs for upload failures
