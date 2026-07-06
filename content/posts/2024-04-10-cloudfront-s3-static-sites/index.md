---
id: 50
title: "Hosting Static Sites with S3 and CloudFront"
publishedAt: "2024-04-10"
excerpt: "Build a fast, secure, and cost-effective static website hosting solution using AWS S3 and CloudFront CDN."
category: "AWS"
tags: ["AWS", "S3", "CloudFront", "Static Sites", "CDN"]
draft: false
---

Static site hosting on AWS is incredibly powerful. By combining S3 for storage and CloudFront for global distribution, you can build sites that are fast, secure, and cost pennies per month.

## Architecture Overview

The setup is straightforward:

```
User → CloudFront → S3 Bucket
         ↓
    Edge Locations (Global)
```

Benefits:
- **Global CDN**: Content cached at edge locations worldwide
- **HTTPS by default**: SSL/TLS certificates via ACM
- **Low cost**: Pay only for what you use
- **High availability**: AWS's infrastructure reliability

## Step-by-Step Setup

### 1. Create an S3 Bucket

```bash
aws s3 mb s3://my-website-bucket --region us-east-1
```

Configure for static hosting:

```bash
aws s3 website s3://my-website-bucket/ \
  --index-document index.html \
  --error-document error.html
```

### 2. Set Bucket Policy

Allow CloudFront to access your content:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "AllowCloudFrontAccess",
    "Effect": "Allow",
    "Principal": {
      "Service": "cloudfront.amazonaws.com"
    },
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::my-website-bucket/*",
    "Condition": {
      "StringEquals": {
        "AWS:SourceArn": "arn:aws:cloudfront::ACCOUNT:distribution/DIST-ID"
      }
    }
  }]
}
```

### 3. Create CloudFront Distribution

Configure with:
- Origin: Your S3 bucket
- Default root object: `index.html`
- Viewer protocol: Redirect HTTP to HTTPS
- Compress objects automatically
- Custom SSL certificate (optional)

### 4. Configure DNS

Point your domain to CloudFront:

```
CNAME: www.example.com → d111111abcdef8.cloudfront.net
A:     example.com → CloudFront alias
```

## Optimization Strategies

### Cache Control Headers

Set appropriate headers for different file types:

```bash
# Cache HTML for 5 minutes
aws s3 cp index.html s3://bucket/ \
  --cache-control "max-age=300"

# Cache images for 1 year
aws s3 cp images/ s3://bucket/images/ \
  --recursive \
  --cache-control "max-age=31536000"

# Cache CSS/JS with fingerprints forever
aws s3 cp assets/ s3://bucket/assets/ \
  --recursive \
  --cache-control "max-age=31536000,immutable"
```

### File Compression

Enable compression in CloudFront:
- Gzip for text-based files
- Automatic compression for HTML, CSS, JS, JSON

This can reduce transfer sizes by 70%+.

### Smart Invalidations

Invalidate only what changed:

```bash
# Invalidate specific files
aws cloudfront create-invalidation \
  --distribution-id E1234EXAMPLE \
  --paths "/index.html" "/about.html"

# Invalidate entire directory
aws cloudfront create-invalidation \
  --distribution-id E1234EXAMPLE \
  --paths "/blog/*"
```

## Security Best Practices

### Block Direct S3 Access

Use Origin Access Control (OAC):
1. Create an OAC in CloudFront
2. Associate with your distribution
3. Update S3 bucket policy to allow only OAC

### Enable WAF

Protect against common attacks:
```
CloudFront → AWS WAF → Rules
- Rate limiting
- SQL injection protection
- XSS prevention
- Geo-blocking
```

### Security Headers

Add headers via CloudFront Functions:

```javascript
function handler(event) {
  var response = event.response;
  var headers = response.headers;

  headers['strict-transport-security'] = {
    value: 'max-age=31536000; includeSubdomains'
  };
  headers['x-content-type-options'] = {
    value: 'nosniff'
  };
  headers['x-frame-options'] = {
    value: 'DENY'
  };
  headers['x-xss-protection'] = {
    value: '1; mode=block'
  };

  return response;
}
```

## CI/CD Integration

Automate deployments with GitHub Actions:

```yaml
name: Deploy to S3
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Build
        run: npm run build

      - name: Deploy to S3
        run: |
          aws s3 sync ./out s3://my-bucket \
            --delete \
            --cache-control max-age=31536000

      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.DIST_ID }} \
            --paths "/*"
```

## Cost Optimization

### Reduce Costs

1. **Use S3 Intelligent-Tiering**: Automatic cost savings
2. **Enable CloudFront compression**: Reduce bandwidth
3. **Set appropriate TTLs**: Fewer origin requests
4. **Use CloudFront Functions**: Cheaper than Lambda@Edge
5. **Monitor usage**: Track costs in Cost Explorer

### Typical Costs

For a blog with 10,000 monthly visitors:
- S3 storage (1GB): $0.02
- S3 requests: $0.05
- CloudFront data transfer: $0.85
- **Total: ~$1/month**

## Common Pitfalls

### SPA Routing Issues

For single-page apps, configure custom error responses:
- Error code: 403
- Response page: `/index.html`
- Response code: 200

### Cache Invalidation Costs

First 1,000 paths/month are free. Beyond that:
- $0.005 per path

Use wildcards strategically:
- ❌ Bad: Invalidate every file individually
- ✅ Good: Invalidate `/blog/*` for all blog updates

### Certificate Regions

ACM certificates for CloudFront MUST be in `us-east-1`.

## Monitoring and Debugging

### CloudWatch Metrics

Track:
- Requests per second
- Error rate (4xx, 5xx)
- Cache hit ratio
- Data transfer

### CloudFront Logs

Enable access logs for detailed analytics:
```
Date Time Edge-Location Bytes IP Method Host URI Status
```

### Real User Monitoring

Integrate tools like:
- CloudWatch RUM
- Google Analytics
- Custom performance tracking

## Conclusion

S3 and CloudFront provide enterprise-grade static hosting at consumer prices. With proper configuration, you get global performance, strong security, and minimal operational overhead.

The key is understanding caching strategies and optimizing for your specific use case. Get these right, and you'll have a site that's fast, reliable, and costs next to nothing to run.
