# Image Workflow Documentation

## Overview

This project uses a unified CLI tool called `blog` to manage all image operations. Images are stored in two locations:

1. **Local**: Original images in `content/posts/` and processed images in `.optimized-images/posts/`
2. **S3**: Both originals and processed images are backed up to S3 for multi-machine workflows

## Quick Start

```bash
# Install the CLI
npm link

# View all commands
blog help

# Get help on a specific command
blog help images:upload
```

## Image Storage Structure

### Local Structure
```
content/posts/{post-slug}/
  ├── index.mdx
  └── cover.jpg              # Original image

.optimized-images/posts/{post-slug}/
  ├── cover-400.webp         # Processed image (400px WebP)
  ├── cover-400.jpg          # Processed image (400px JPEG)
  ├── cover-800.webp         # Processed image (800px WebP)
  ├── cover-800.jpg          # Processed image (800px JPEG)
  ├── cover-1200.webp        # Processed image (1200px WebP)
  └── cover-1200.jpg         # Processed image (1200px JPEG)
```

### S3 Structure
```
s3://micahwalter-www-images/
  ├── images/originals/posts/{post-slug}/
  │   └── cover.jpg          # Original backup
  └── images/posts/{post-slug}/
      ├── cover-400.webp     # Processed images
      ├── cover-400.jpg
      └── ...
```

## Common Workflows

### 1. Adding Images to a New Post

```bash
# 1. Add your original image to the post directory
cp ~/Downloads/photo.jpg content/posts/2024-01-15-my-post/cover.jpg

# 2. Optimize and upload everything
blog images:sync
```

### 2. Setting Up on a New Machine

```bash
# Clone the repo
git clone <repo-url>
cd micahwalter-www

# Install dependencies
npm install

# Link the CLI
npm link

# Download all images from S3
blog images:download

# Now you have both originals and processed images!
```

### 3. Just Optimizing Locally (for development)

```bash
# Optimize images without uploading
blog images:optimize

# Use local dev workflow
npm run images:dev  # or blog images:optimize && npm run copy-images-local
```

### 4. Uploading to Different AWS Profiles

```bash
# Upload using specific AWS profile
blog images:upload --profile www

# Or sync with specific profile
blog images:sync --profile www
```

## Available Commands

### `blog images:optimize`
Process images into multiple sizes and formats (WebP + JPEG fallbacks at 400px, 800px, 1200px).

**Options:**
- None (automatically processes all images in `content/posts/`)

**Output:**
- `.optimized-images/posts/{post-slug}/`

### `blog images:upload`
Upload both original and processed images to S3.

**Options:**
- `--dry-run` - Preview what would be uploaded
- `--profile <name>` - Use specific AWS profile
- `--originals-only` - Only upload originals
- `--processed-only` - Only upload processed images

**Examples:**
```bash
blog images:upload
blog images:upload --dry-run
blog images:upload --profile www
blog images:upload --originals-only
```

### `blog images:download`
Download images from S3 to local directories.

**Options:**
- `--dry-run` - Preview what would be downloaded
- `--profile <name>` - Use specific AWS profile
- `--originals-only` - Only download originals
- `--processed-only` - Only download processed images

**Examples:**
```bash
blog images:download
blog images:download --originals-only
blog images:download --profile www
```

### `blog images:sync`
Complete workflow: optimize locally, then upload both originals and processed to S3.

**Options:**
- `--dry-run` - Preview mode
- `--profile <name>` - Use specific AWS profile

**Examples:**
```bash
blog images:sync
blog images:sync --dry-run
blog images:sync --profile www
```

### `blog build:static`
Generate static build files (RSS feed, sitemap, posts.json).

**Examples:**
```bash
blog build:static
```

## Environment Variables

Configure in `.env.local` or shell environment:

```bash
# S3 bucket name
IMAGES_BUCKET=micahwalter-www-images

# AWS region
AWS_REGION=us-east-1

# AWS profile (alternative to --profile flag)
AWS_PROFILE=www
```

## Troubleshooting

### "AWS CLI not found"
Install AWS CLI: https://aws.amazon.com/cli/

### "No optimized images found"
Run `blog images:optimize` first before uploading.

### "No originals found in S3"
This is normal if you haven't uploaded originals yet. Run `blog images:upload` to back them up.

### Images not showing on new machine
1. Make sure you've run `blog images:download`
2. Check that AWS credentials are configured
3. Verify bucket name in environment variables

## Migration from Old Workflow

If you were using the old npm scripts:

**Old:**
```bash
npm run optimize-images
npm run upload-images
```

**New (equivalent):**
```bash
blog images:optimize
blog images:upload
```

**Or use the combined command:**
```bash
blog images:sync
```

## Benefits of This Workflow

1. **Originals are backed up** - Never lose your source images
2. **Multi-machine ready** - Easy to work from laptop/desktop/any machine
3. **Unified CLI** - One tool for all operations with contextual help
4. **Dry-run support** - Preview changes before executing
5. **Selective sync** - Download/upload only what you need
6. **Fast sync** - Uses `aws s3 sync` for efficient transfers
