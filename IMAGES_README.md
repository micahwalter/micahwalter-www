# Image Management Guide

## Overview

This project uses an optimized image workflow that:
- ✅ Keeps images out of Git (no repo bloat)
- ✅ Stores images in S3 for scalability
- ✅ Automatically generates responsive WebP + JPEG images
- ✅ Serves optimized images through CloudFront CDN

## Quick Start

### Adding Images to a Blog Post

**Images are managed locally and uploaded manually to S3.**

1. **Place your image** in the post directory:
   ```
   content/posts/2024-01-15-my-post/
   ├── index.mdx
   └── cover.jpg          ← Your image (1200px recommended)
   ```

2. **Reference it in frontmatter**:
   ```yaml
   ---
   title: "My Blog Post"
   coverImage: "./cover.jpg"
   ---
   ```

3. **Optimize and upload images** (locally):
   ```bash
   npm run optimize-images    # Generate optimized variants
   npm run upload-images      # Upload to S3
   ```

4. **Commit and push** (only the MDX file - images are gitignored):
   ```bash
   git add content/posts/2024-01-15-my-post/index.mdx
   git commit -m "Add new blog post"
   git push
   ```

5. **GitHub Actions will**:
   - Build your Next.js site
   - Deploy to S3
   - Invalidate CloudFront cache

Your optimized images (already in S3) will be served via CloudFront!

## Image Specifications

### Recommended Settings

**Cover Images:**
- Width: 1200px (or height for portraits)
- Format: JPEG or PNG (will be converted)
- Quality: High (optimization is automatic)
- Max file size: 2MB (before optimization)
- Aspect ratio: 16:9 or 4:3 recommended

**File naming:**
- Use descriptive names: `cover.jpg`, `diagram.png`, `screenshot.jpg`
- Avoid generic names: `img1.jpg`, `photo.png`

## Scripts

### Optimize Images Locally

Generate optimized images for all posts:

```bash
npm run optimize-images
```

Output: `.optimized-images/posts/[slug]/`
- `cover-400.webp`, `cover-400.jpg`
- `cover-800.webp`, `cover-800.jpg`
- `cover-1200.webp`, `cover-1200.jpg`

### Upload to S3

Upload optimized images to S3:

```bash
npm run upload-images
```

**Dry run** (preview without uploading):
```bash
npm run upload-images -- --dry-run
```

### Both in One Command

```bash
npm run images
```

## How It Works

### 1. Build Pipeline

```
Developer adds image locally
         ↓
   npm run optimize-images
   (generates 6 variants locally)
         ↓
   npm run upload-images
   (uploads to S3 images bucket)
         ↓
  Git commit (MDX only, image gitignored)
         ↓
     Push to GitHub
         ↓
   GitHub Actions builds Next.js
         ↓
   Deploy static site to S3
         ↓
 Serve site + images via CloudFront
 (site from website bucket, images from images bucket)
```

### 2. Image Serving

When a user visits your blog:

```html
<!-- Browser receives: -->
<picture>
  <source
    srcset="
      https://cdn.example.com/images/posts/slug/cover-400.webp 400w,
      https://cdn.example.com/images/posts/slug/cover-800.webp 800w,
      https://cdn.example.com/images/posts/slug/cover-1200.webp 1200w
    "
    type="image/webp"
  />
  <source
    srcset="
      https://cdn.example.com/images/posts/slug/cover-400.jpg 400w,
      https://cdn.example.com/images/posts/slug/cover-800.jpg 800w,
      https://cdn.example.com/images/posts/slug/cover-1200.jpg 1200w
    "
    type="image/jpeg"
  />
  <img src="https://cdn.example.com/images/posts/slug/cover-800.jpg" alt="..." />
</picture>
```

**Browser intelligently chooses:**
- **Format**: WebP if supported (most browsers), otherwise JPEG
- **Size**: Based on viewport width (mobile gets 400px, desktop gets 1200px)

### 3. File Sizes

Example for a typical cover image:

| Size | Format | File Size | Savings |
|------|--------|-----------|---------|
| Original | JPEG | 800 KB | - |
| 1200px | WebP | 160 KB | 80% |
| 1200px | JPEG | 189 KB | 76% |
| 800px | WebP | 80 KB | 90% |
| 800px | JPEG | 89 KB | 89% |
| 400px | WebP | 20 KB | 97% |
| 400px | JPEG | 23 KB | 97% |

Mobile users downloading 400px WebP save **97%** bandwidth! 🚀

## Using the ResponsiveImage Component

### In Your Components

```typescript
import { CoverImage } from "@/components/ResponsiveImage";

// Simple usage
<CoverImage
  slug="my-post-slug"
  alt="Cover image description"
/>

// Custom filename
<CoverImage
  slug="my-post-slug"
  filename="hero"
  alt="Hero image"
/>

// Full control
import ResponsiveImage from "@/components/ResponsiveImage";

<ResponsiveImage
  src="/images/posts/my-post/diagram"
  alt="Architecture diagram"
  sizes="(max-width: 768px) 100vw, 645px"
  priority={true}
/>
```

### Props

**CoverImage:**
- `slug` - Post slug (required)
- `filename` - Image name without extension (default: "cover")
- `alt` - Alt text (required)
- `sizes` - Responsive sizes (optional)
- `priority` - Eager loading for above-fold images (default: false)
- `className` - CSS classes (optional)

## File Structure

```
project/
├── content/posts/
│   └── 2024-01-15-my-post/
│       ├── index.mdx                    ✅ Committed to Git
│       └── cover.jpg                    ❌ Gitignored
│
├── .optimized-images/                   ❌ Gitignored (local build artifact)
│   └── posts/
│       └── 2024-01-15-my-post/
│           ├── cover-400.webp
│           ├── cover-400.jpg
│           ├── cover-800.webp
│           ├── cover-800.jpg
│           ├── cover-1200.webp
│           └── cover-1200.jpg
│
└── scripts/
    ├── optimize-images.js               ✅ Committed to Git
    └── upload-images.js                 ✅ Committed to Git

S3 (micahwalter-www-website):
└── images/posts/
    └── 2024-01-15-my-post/
        ├── cover-400.webp               📦 Uploaded to S3
        ├── cover-400.jpg                📦 Uploaded to S3
        ├── cover-800.webp               📦 Uploaded to S3
        ├── cover-800.jpg                📦 Uploaded to S3
        ├── cover-1200.webp              📦 Uploaded to S3
        └── cover-1200.jpg               📦 Uploaded to S3
```

## Environment Variables

### GitHub Actions (Already Configured)

```yaml
AWS_ROLE_ARN: ${{ secrets.AWS_ROLE_ARN }}
AWS_REGION: us-east-1
S3_BUCKET: micahwalter-www-website
```

### Local Development (Optional)

If you want to upload images locally:

```bash
# Using AWS CLI profile
AWS_PROFILE=your-profile npm run upload-images

# Or set environment variables
export AWS_REGION=us-east-1
export S3_BUCKET=micahwalter-www-website
npm run upload-images
```

## IAM Permissions

The GitHub Actions role needs these S3 permissions:

```json
{
  "Effect": "Allow",
  "Action": [
    "s3:PutObject",
    "s3:GetObject",
    "s3:ListBucket"
  ],
  "Resource": [
    "arn:aws:s3:::micahwalter-www-website/images/*",
    "arn:aws:s3:::micahwalter-www-website"
  ]
}
```

## Troubleshooting

### Images not loading after deploy

1. **Check S3**: Verify images uploaded to `s3://micahwalter-www-website/images/posts/[slug]/`
   ```bash
   aws s3 ls s3://micahwalter-www-website/images/posts/[slug]/
   ```

2. **Check CloudFront**: May take a few minutes to propagate. Try invalidating:
   ```bash
   aws cloudfront create-invalidation \
     --distribution-id E1SZIKPZ79BHDU \
     --paths "/images/*"
   ```

3. **Check browser console**: Look for 404 errors - may indicate wrong path

### Build fails during image optimization

1. **Check sharp installation**: Platform-specific binaries
   ```bash
   npm rebuild sharp
   ```

2. **Check image format**: Ensure it's JPEG, PNG, or WebP

3. **Check file size**: Very large images (>10MB) may cause issues

### Images load but are poor quality

1. **Adjust quality settings** in `scripts/optimize-images.js`:
   ```javascript
   const WEBP_QUALITY = 85;  // Increase to 90-95 for higher quality
   const JPEG_QUALITY = 85;  // Increase to 90-95 for higher quality
   ```

2. **Use larger source images**: At least 1200px recommended

## Migration Guide

### Migrating Existing Images

If you have images already committed to Git:

1. **Run optimization locally**:
   ```bash
   npm run optimize-images
   npm run upload-images
   ```

2. **Verify images in S3**:
   ```bash
   aws s3 ls s3://micahwalter-www-website/images/posts/ --recursive
   ```

3. **Update components** to use `CoverImage` (if not already done)

4. **Optional: Remove from Git history** (to reclaim space):
   ```bash
   # Use BFG Repo-Cleaner or git filter-branch
   # CAUTION: This rewrites history!
   git filter-branch --tree-filter 'rm -rf content/posts/**/*.jpg' HEAD
   ```

## Performance Metrics

### Expected Improvements

**Before Optimization:**
- Cover image: ~800 KB
- Mobile load time: 1-2s on 3G
- Lighthouse Performance: 70-80

**After Optimization:**
- Cover image: ~20-160 KB (depending on device)
- Mobile load time: 0.3-0.6s on 3G
- Lighthouse Performance: 90-100

### WebP Support

WebP is supported by 97%+ of browsers:
- ✅ Chrome 32+
- ✅ Firefox 65+
- ✅ Safari 14+
- ✅ Edge 18+
- ❌ IE 11 (falls back to JPEG)

## Cost Analysis

### Storage Costs

For 100 blog posts with 1 cover image each:
- Original images: 100 × 800 KB = 80 MB
- Optimized images: 100 × 6 files × ~100 KB avg = 60 MB
- **S3 cost**: 60 MB × $0.023/GB = **$0.001/month** (negligible)

### Transfer Costs

For 10,000 page views/month:
- Without optimization: 10,000 × 800 KB = 8 GB
- With optimization: 10,000 × 100 KB avg = 1 GB
- **CloudFront cost**: 1 GB × $0.085/GB = **$0.09/month**
- **Savings**: ~87% bandwidth reduction

## Future Enhancements

Potential improvements not currently implemented:

- [ ] AVIF format (better compression, lower browser support)
- [ ] Blur placeholders for better UX
- [ ] Automatic alt text generation with AI
- [ ] Image CDN (Cloudinary/imgix) if traffic scales significantly
- [ ] Art direction (different crops for mobile vs desktop)

## Support

For issues or questions:
- Check [IMAGE_OPTIMIZATION_PLAN.md](./IMAGE_OPTIMIZATION_PLAN.md) for detailed architecture
- Review [GitHub Actions logs](../../actions) for deployment issues
- Check [AWS CloudWatch](https://console.aws.amazon.com/cloudwatch/) for S3/CloudFront metrics
