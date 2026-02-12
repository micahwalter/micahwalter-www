# Blog CLI - Quick Reference

## Daily Workflow

### Create and preview new post
```bash
# 1. Create new post (starts as draft: true)
blog post:new "My Post Title"

# 2. Edit the post content
# content/posts/YYYY-MM-DD-slug/index.mdx

# 3. Preview locally (drafts visible in dev mode)
npm run dev

# 4. Add images if needed
cp ~/photo.jpg content/posts/YYYY-MM-DD-my-post/cover.jpg

# 5. When ready to publish, set draft: false in frontmatter

# 6. Optimize and upload everything
blog images:sync --profile www
```

### Work on new machine
```bash
# Setup
git clone <repo>
npm install
npm link

# Download all images
blog images:download --profile www

# Now you have everything!
```

## Quick Commands

| Command | What it does |
|---------|--------------|
| `blog help` | Show all commands |
| `blog post:new` | Create a new blog post with template |
| `blog post:new "My Title"` | Create post with title (skips prompt) |
| `blog images:optimize` | Process images (400/800/1200px WebP+JPEG) |
| `blog images:upload --profile www` | Upload originals + processed to S3 |
| `blog images:download --profile www` | Download from S3 to local |
| `blog images:sync --profile www` | Optimize + Upload (one command!) |
| `blog build:static` | Generate RSS, sitemap, posts.json |

## Useful Flags

- `--dry-run` - Preview without executing
- `--profile <name>` - Use specific AWS profile
- `--originals-only` - Only originals
- `--processed-only` - Only processed images

## Examples

```bash
# Preview what would be uploaded
blog images:upload --dry-run --profile www

# Only download original images
blog images:download --originals-only --profile www

# Full sync workflow
blog images:sync --profile www
```

## File Locations

- **Originals**: `content/posts/{post-slug}/*.jpg`
- **Processed**: `.optimized-images/posts/{post-slug}/*-{size}.{webp|jpg}`
- **S3 Originals**: `s3://bucket/images/originals/posts/{post-slug}/`
- **S3 Processed**: `s3://bucket/images/posts/{post-slug}/`

## Troubleshooting

**Images not uploading?**
```bash
# Check AWS credentials
aws s3 ls --profile www

# Try dry-run first
blog images:upload --dry-run --profile www
```

**Need to re-optimize all images?**
```bash
rm -rf .optimized-images
blog images:optimize
```

**Starting fresh on new machine?**
```bash
blog images:download --profile www
# Downloads everything you need!
```
