/**
 * Enhanced S3 Image Upload Script
 *
 * Uploads BOTH original and processed images to S3:
 * - Originals: s3://bucket/images/originals/posts/{slug}/{filename}
 * - Processed: s3://bucket/images/posts/{slug}/{filename}
 *
 * This ensures originals are backed up and can be downloaded on other machines.
 *
 * Usage:
 *   node scripts/upload-images-v2.js                    # Upload all images
 *   node scripts/upload-images-v2.js --dry-run          # Preview what would be uploaded
 *   node scripts/upload-images-v2.js --profile www      # Use specific AWS profile
 *   node scripts/upload-images-v2.js --originals-only   # Only upload originals
 *   node scripts/upload-images-v2.js --processed-only   # Only upload processed
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Parse command-line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const ORIGINALS_ONLY = args.includes('--originals-only');
const PROCESSED_ONLY = args.includes('--processed-only');
const profileIndex = args.indexOf('--profile');
const AWS_PROFILE = profileIndex !== -1 && args[profileIndex + 1] ? args[profileIndex + 1] : process.env.AWS_PROFILE;

// Configuration
const POSTS_DIR = path.join(process.cwd(), 'content/posts');
const PROCESSED_DIR = path.join(process.cwd(), '.optimized-images/posts');
const BUCKET_NAME = process.env.IMAGES_BUCKET || process.env.IMAGES_BUCKET_NAME || 'micahwalter-www-images';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// S3 prefixes
const ORIGINALS_PREFIX = 'images/originals/posts';
const PROCESSED_PREFIX = 'images/posts';

// Cache control
const CACHE_CONTROL = 'public, max-age=31536000, immutable';

// Supported image formats
const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp)$/i;

/**
 * Check if AWS CLI is available
 */
function checkAwsCli() {
  try {
    execSync('aws --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get all original images from posts directory
 */
function getOriginalImages() {
  if (!fs.existsSync(POSTS_DIR)) {
    return [];
  }

  const images = [];
  const postDirs = fs.readdirSync(POSTS_DIR);

  for (const postDir of postDirs) {
    const postPath = path.join(POSTS_DIR, postDir);
    if (!fs.statSync(postPath).isDirectory()) continue;

    const files = fs.readdirSync(postPath);
    for (const file of files) {
      if (IMAGE_EXTENSIONS.test(file)) {
        images.push({
          localPath: path.join(postPath, file),
          s3Key: `${ORIGINALS_PREFIX}/${postDir}/${file}`,
          postSlug: postDir,
          filename: file,
          type: 'original'
        });
      }
    }
  }

  return images;
}

/**
 * Upload originals to S3 using aws s3 sync
 */
function uploadOriginals() {
  if (PROCESSED_ONLY) {
    console.log('ℹ️  Skipping originals (--processed-only flag)\n');
    return;
  }

  console.log('📁 Uploading original images...');
  console.log(`   Source: ${POSTS_DIR}`);
  console.log(`   Bucket: s3://${BUCKET_NAME}/${ORIGINALS_PREFIX}/`);

  const dryRunFlag = DRY_RUN ? '--dryrun' : '';
  const profileFlag = AWS_PROFILE ? `--profile ${AWS_PROFILE}` : '';

  try {
    // Use sync with --include to only sync image files
    const cmd = `aws s3 sync "${POSTS_DIR}" "s3://${BUCKET_NAME}/${ORIGINALS_PREFIX}/" \
      --region ${AWS_REGION} \
      --exclude "*" \
      --include "*.jpg" \
      --include "*.jpeg" \
      --include "*.png" \
      --include "*.gif" \
      --include "*.webp" \
      --cache-control "${CACHE_CONTROL}" \
      --size-only \
      ${profileFlag} \
      ${dryRunFlag}`;

    execSync(cmd, { stdio: 'inherit' });
    console.log('   ✅ Originals uploaded\n');
  } catch (error) {
    console.error('   ❌ Failed to upload originals:', error.message);
    throw error;
  }
}

/**
 * Upload processed images to S3 using aws s3 sync
 */
function uploadProcessed() {
  if (ORIGINALS_ONLY) {
    console.log('ℹ️  Skipping processed images (--originals-only flag)\n');
    return;
  }

  if (!fs.existsSync(PROCESSED_DIR)) {
    console.log('ℹ️  No processed images found. Run: blog images:optimize\n');
    return;
  }

  console.log('🖼️  Uploading processed images...');
  console.log(`   Source: ${PROCESSED_DIR}`);
  console.log(`   Bucket: s3://${BUCKET_NAME}/${PROCESSED_PREFIX}/`);

  const dryRunFlag = DRY_RUN ? '--dryrun' : '';
  const profileFlag = AWS_PROFILE ? `--profile ${AWS_PROFILE}` : '';

  try {
    const cmd = `aws s3 sync "${PROCESSED_DIR}" "s3://${BUCKET_NAME}/${PROCESSED_PREFIX}/" \
      --region ${AWS_REGION} \
      --cache-control "${CACHE_CONTROL}" \
      --size-only \
      ${profileFlag} \
      ${dryRunFlag}`;

    execSync(cmd, { stdio: 'inherit' });
    console.log('   ✅ Processed images uploaded\n');
  } catch (error) {
    console.error('   ❌ Failed to upload processed images:', error.message);
    throw error;
  }
}

/**
 * Main execution
 */
function main() {
  console.log('📦 S3 Image Upload (Enhanced)\n');

  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No files will be uploaded\n');
  }

  if (AWS_PROFILE) {
    console.log(`🔑 Using AWS profile: ${AWS_PROFILE}\n`);
  }

  // Check prerequisites
  if (!checkAwsCli()) {
    console.error('❌ AWS CLI not found. Please install it first:');
    console.error('   https://aws.amazon.com/cli/');
    process.exit(1);
  }

  const startTime = Date.now();

  // Upload originals
  uploadOriginals();

  // Upload processed
  uploadProcessed();

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('✅ Upload complete!');
  console.log(`   Duration: ${duration}s`);

  if (!DRY_RUN) {
    console.log('\n🌐 Images available at:');
    console.log(`   Originals:  https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${ORIGINALS_PREFIX}/`);
    console.log(`   Processed:  https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${PROCESSED_PREFIX}/`);
  }
}

// Run the script
main();
