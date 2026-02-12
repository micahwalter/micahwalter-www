# Image Optimization Implementation Plan

## Overview

This document outlines the strategy for managing blog post images at scale, addressing two key concerns:
1. **Storage**: Moving images out of Git to dedicated S3 storage
2. **Optimization**: Implementing responsive WebP images with JPEG fallback

## Current State

- Images stored in `content/posts/[slug]/` and committed to Git
- Build script copies images to `public/images/posts/`
- Everything deployed to S3 bucket via GitHub Actions
- Images served through CloudFront distribution

**Problem**: This approach doesn't scale as GitHub repos have size limitations.

## Proposed Architecture

### Storage Strategy: Dedicated S3 Bucket

We'll use a separate S3 bucket (or prefix) for images:

```
s3://micahwalter-www-images/
  posts/
    [slug]/
      cover-400.webp
      cover-400.jpg
      cover-800.webp
      cover-800.jpg
      cover-1200.webp
      cover-1200.jpg
      [other-image]-400.webp
      ...
```

**Why S3 instead of Git LFS?**
- ✅ Cheaper: ~$0.023/GB/month vs $5/50GB
- ✅ Unlimited storage
- ✅ Already using S3/CloudFront infrastructure
- ✅ No Git workflow complexity
- ✅ Images only uploaded when changed

### Optimization Strategy: Pre-build Processing

Images will be optimized at build time, not runtime:

**Input**: Original image at 1200px (JPEG/PNG)
**Output**: 6 optimized files per image
- 3 WebP sizes: 400px, 800px, 1200px (smaller, modern format)
- 3 JPEG sizes: 400px, 800px, 1200px (fallback for older browsers)

**Benefits**:
- No Lambda@Edge costs or complexity
- Fast delivery (everything cached in CloudFront)
- Responsive images for different devices/viewports
- WebP provides ~30% smaller file sizes

## Implementation Components

### 1. Image Processing Script

**File**: `scripts/optimize-images.js`

```javascript
// Processes all images in content/posts/
// Outputs to .optimized-images/ (gitignored)
// Uses sharp library for resizing and format conversion
```

**Features**:
- Resize to 400px, 800px, 1200px (maintains aspect ratio)
- Convert to WebP (quality: 85)
- Generate JPEG fallback (quality: 85)
- Skip if output already exists and is newer than source
- Log processing stats

### 2. S3 Upload Script

**File**: `scripts/upload-images.js`

```javascript
// Uploads optimized images to S3
// Only uploads changed files (checksums)
// Sets appropriate cache headers
```

**Features**:
- Upload to `s3://micahwalter-www-images/posts/[slug]/`
- Set cache headers: `Cache-Control: public, max-age=31536000, immutable`
- Only upload if file changed (MD5 comparison)
- Support for dry-run mode

### 3. Responsive Image Component

**File**: `components/ResponsiveImage.tsx`

```typescript
// React component for responsive images
// Uses <picture> with srcset for WebP + JPEG fallback
```

**Features**:
- Automatic WebP with JPEG fallback
- Responsive sizing with srcset
- Lazy loading
- Alt text support
- Optional aspect ratio placeholder

### 4. GitHub Actions Workflow

**Updates to**: `.github/workflows/deploy.yml`

**New steps**:
1. Optimize images (only if images changed)
2. Upload images to S3 (only changed files)
3. Regular Next.js build and deploy

**Optimization**:
- Cache optimized images between builds
- Skip optimization if no image changes detected

### 5. Git Configuration

**Updates to**: `.gitignore`

```
# Ignore actual image files
content/posts/**/*.jpg
content/posts/**/*.jpeg
content/posts/**/*.png
content/posts/**/*.webp

# Keep folder structure and MDX
!content/posts/**/index.mdx

# Ignore optimization output
.optimized-images/
```

**Migration**: Use `.gitkeep` files to preserve folder structure

## Workflow

### For Developers (Adding New Images)

1. Place original image in `content/posts/[slug]/cover.jpg` (1200px recommended)
2. Reference in MDX: `coverImage: "./cover.jpg"`
3. Commit only the MDX (images gitignored)
4. Push to GitHub
5. CI handles optimization and upload

### Build Process

```
1. Developer pushes code
2. GitHub Actions runs:
   ├─ Install dependencies (including sharp)
   ├─ Optimize images → .optimized-images/
   ├─ Upload to S3 (only changed files)
   ├─ Build Next.js site
   └─ Deploy static site to S3
3. CloudFront serves both:
   ├─ Site files from micahwalter-www-website
   └─ Images from micahwalter-www-images (via CloudFront)
```

### Image Serving

```html
<!-- Component generates: -->
<picture>
  <source
    srcset="
      https://cdn.micahwalter.com/posts/slug/cover-400.webp 400w,
      https://cdn.micahwalter.com/posts/slug/cover-800.webp 800w,
      https://cdn.micahwalter.com/posts/slug/cover-1200.webp 1200w
    "
    type="image/webp"
  />
  <source
    srcset="
      https://cdn.micahwalter.com/posts/slug/cover-400.jpg 400w,
      https://cdn.micahwalter.com/posts/slug/cover-800.jpg 800w,
      https://cdn.micahwalter.com/posts/slug/cover-1200.jpg 1200w
    "
    type="image/jpeg"
  />
  <img
    src="https://cdn.micahwalter.com/posts/slug/cover-800.jpg"
    alt="Cover image"
    loading="lazy"
  />
</picture>
```

Browser will:
- Use WebP if supported
- Choose appropriate size based on viewport
- Fall back to JPEG for older browsers
- Lazy load below fold

## CloudFront Configuration

We'll need to configure CloudFront to serve from both S3 buckets. Two options:

### Option A: Single Distribution, Multiple Origins

- Origin 1: `micahwalter-www-website` (site files)
- Origin 2: `micahwalter-www-images` (images)
- Behavior: `/images/*` → Origin 2, everything else → Origin 1

### Option B: Reuse Existing Bucket with Prefix

- Store images in `micahwalter-www-website/images/`
- Upload directly during build
- No CloudFront changes needed

**Recommendation**: Start with Option B (simpler), migrate to Option A if image storage grows significantly.

## Cost Analysis

### Current (Git LFS if scaled to 10GB images):
- GitHub LFS: $5/month per 50GB storage+bandwidth
- For 10GB storage + moderate traffic: ~$5-10/month

### Proposed (S3 + CloudFront):
- S3 storage: 10GB × $0.023 = $0.23/month
- S3 requests: negligible (only on CI uploads)
- CloudFront: Pay for what you use (likely < $1/month for a blog)
- **Total: ~$1-2/month** (85% savings)

Plus:
- No repo size concerns
- Better performance (CloudFront edge caching)
- Proper image optimization

## Migration Plan

### Phase 1: Setup (This PR)
- [ ] Add sharp dependency
- [ ] Create optimization script
- [ ] Create upload script
- [ ] Create ResponsiveImage component
- [ ] Update GitHub Actions
- [ ] Update .gitignore
- [ ] Document in README

### Phase 2: Test with Existing Image
- [ ] Run optimization locally on existing cover.jpg
- [ ] Verify output quality/sizes
- [ ] Test upload to S3
- [ ] Test rendering with ResponsiveImage
- [ ] Verify CloudFront serving

### Phase 3: Deploy
- [ ] Merge PR
- [ ] Monitor first automated build
- [ ] Verify images loading correctly
- [ ] Check CloudFront cache headers

### Phase 4: Cleanup (Optional)
- [ ] Remove existing cover.jpg from Git history (to reclaim space)
- [ ] Document image guidelines for future posts

## Configuration Requirements

### Environment Variables (GitHub Secrets)

Already configured:
- `AWS_ROLE_ARN` - For OIDC authentication
- `AWS_REGION` - us-east-1

May need to add:
- `IMAGES_BUCKET_NAME` - S3 bucket for images (or use existing)
- `CLOUDFRONT_DOMAIN` - For generating image URLs

### AWS IAM Permissions

GitHub Actions role needs:
```json
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
```

## Image Guidelines for Content Authors

### Recommended Specifications

**Cover Images**:
- Dimensions: 1200px wide (or 1200px tall for portraits)
- Format: JPEG or PNG (will be converted to WebP + JPEG)
- Quality: High quality, compression will be handled automatically
- File size: < 2MB (original, before optimization)
- Aspect ratio: 16:9 or 4:3 recommended for consistency

**In-post Images**:
- Same as above
- Name descriptively: `architecture-diagram.png` not `img1.png`

### Where to Place Images

```
content/posts/
  2024-01-15-building-ai-agents/
    index.mdx
    cover.jpg          ← Cover image
    diagram.png        ← Additional images
    screenshot.jpg
```

### How to Reference in MDX

```yaml
---
title: "My Post"
coverImage: "./cover.jpg"
---

![Architecture diagram](./diagram.png)
```

The build system will:
1. Find all images in post folder
2. Optimize to multiple sizes and formats
3. Upload to S3
4. Rewrite MDX image paths to use CDN URLs

## Performance Metrics

### Expected Improvements

**Before** (current):
- Cover image: ~800KB JPEG at 1200px
- Load time: ~1-2s on 3G
- No responsive sizing

**After** (optimized):
- Cover image WebP: ~280KB at 1200px, ~90KB at 400px (65-89% smaller)
- Cover image JPEG fallback: ~400KB at 1200px, ~130KB at 400px
- Load time: ~0.3-0.6s on 3G (for correctly sized image)
- Responsive: Mobile loads 400px, tablet 800px, desktop 1200px

### Lighthouse Impact

- **Performance**: +10-20 points (smaller images, proper sizing)
- **Best Practices**: +5 points (WebP modern format)
- **SEO**: +5 points (faster LCP)

## Monitoring and Debugging

### Build Logs
- Watch GitHub Actions output for optimization stats
- Check S3 upload confirmations
- Monitor build time increase (should be < 30s for 5 images)

### CloudFront Logs
- Enable access logs to monitor cache hit rate
- Should see >95% cache hit rate after warmup

### Testing Checklist
- [ ] WebP loads in Chrome/Firefox/Edge
- [ ] JPEG fallback loads in older browsers
- [ ] Correct image size loads on mobile/tablet/desktop
- [ ] Images load from CloudFront (check Network tab)
- [ ] Lazy loading works (images below fold load on scroll)
- [ ] Cache headers correct (check Response headers)

## Rollback Plan

If issues arise:

1. **Quick fix**: Revert to `main` branch
2. **Image serving issues**: Temporarily copy images to `public/` in emergency commit
3. **Build failures**: Check sharp installation (platform-specific binaries)
4. **S3 upload failures**: Verify AWS credentials and IAM permissions

## Future Enhancements

### Potential Additions (Not in Scope):

1. **AVIF support**: Even better compression than WebP (when browser support improves)
2. **Image CDN**: Move to dedicated service like Cloudinary/imgix (if traffic grows significantly)
3. **Automatic image optimization**: Git hook to optimize images before commit
4. **Blur placeholders**: Generate tiny base64 placeholder for better UX
5. **Art direction**: Different crops for mobile vs desktop
6. **Automatic alt text**: Use AI to generate descriptive alt text

## Questions and Decisions

### Decision Log

**Q: Separate S3 bucket or use existing?**
A: Start with existing bucket using `/images` prefix. Easier setup, no CloudFront changes needed. Can migrate later if needed.

**Q: Where to store .optimized-images/?**
A: Local gitignored folder, regenerated on each build. Alternative: Cache in GitHub Actions to speed up builds.

**Q: Handle images in Git history?**
A: Phase 4 optional cleanup. Can use `git filter-branch` or BFG Repo-Cleaner to purge if needed.

**Q: What about social media preview images (og:image)?**
A: Use the 1200px version, ensure it's optimized. Add to metadata generation.

## References

- [Sharp documentation](https://sharp.pixelplumbing.com/)
- [WebP browser support](https://caniuse.com/webp) - 97%+ global support
- [Responsive images guide](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)
- [AWS S3 pricing](https://aws.amazon.com/s3/pricing/)
- [CloudFront pricing](https://aws.amazon.com/cloudfront/pricing/)

---

**Document Status**: Ready for implementation
**Last Updated**: 2026-02-12
**Author**: Claude Code
