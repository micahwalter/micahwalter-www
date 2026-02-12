/**
 * S3 Image Upload Script
 *
 * Uploads optimized images to S3 bucket.
 * Only uploads files that have changed (based on size/mtime).
 *
 * Usage:
 *   node scripts/upload-images.js                    # Upload all images
 *   node scripts/upload-images.js --dry-run          # Preview what would be uploaded
 *   node scripts/upload-images.js --profile www      # Use specific AWS profile
 *   node scripts/upload-images.js --profile www --dry-run  # Combine options
 *
 * Environment variables:
 *   IMAGES_BUCKET - S3 bucket name (default: micahwalter-www-images)
 *   AWS_REGION - AWS region (default: us-east-1)
 *   AWS_PROFILE - AWS profile (can also use --profile argument)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Parse command-line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const profileIndex = args.indexOf('--profile');
const AWS_PROFILE = profileIndex !== -1 && args[profileIndex + 1] ? args[profileIndex + 1] : process.env.AWS_PROFILE;

// Configuration
const IMAGES_DIR = path.join(process.cwd(), '.optimized-images/posts');
const BUCKET_NAME = process.env.IMAGES_BUCKET || process.env.IMAGES_BUCKET_NAME || 'micahwalter-www-images';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const S3_PREFIX = 'images/posts'; // Path within bucket

// Cache control for images (1 year, immutable)
const CACHE_CONTROL = 'public, max-age=31536000, immutable';

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
 * Get all files in optimized images directory
 */
function getOptimizedImages() {
  if (!fs.existsSync(IMAGES_DIR)) {
    console.log('ℹ️  No optimized images found. Run npm run optimize-images first.');
    return [];
  }

  const files = [];
  const postDirs = fs.readdirSync(IMAGES_DIR);

  for (const postDir of postDirs) {
    const postPath = path.join(IMAGES_DIR, postDir);
    if (!fs.statSync(postPath).isDirectory()) continue;

    const images = fs.readdirSync(postPath);
    for (const image of images) {
      files.push({
        localPath: path.join(postPath, image),
        s3Key: `${S3_PREFIX}/${postDir}/${image}`,
        postSlug: postDir,
        filename: image
      });
    }
  }

  return files;
}

/**
 * Upload a file to S3
 */
function uploadFile(file, index, total) {
  const { localPath, s3Key } = file;
  const s3Uri = `s3://${BUCKET_NAME}/${s3Key}`;

  // Determine content type
  const ext = path.extname(localPath).toLowerCase();
  const contentType = ext === '.webp' ? 'image/webp' : 'image/jpeg';

  const stats = fs.statSync(localPath);
  const sizeKB = (stats.size / 1024).toFixed(1);

  console.log(`  [${index + 1}/${total}] Uploading ${file.filename} (${sizeKB} KB)`);

  if (DRY_RUN) {
    console.log(`      → ${s3Uri} (dry run, skipped)`);
    return { uploaded: false, skipped: true };
  }

  try {
    const cmd = `aws s3 cp "${localPath}" "${s3Uri}" \
      --region ${AWS_REGION} \
      --content-type "${contentType}" \
      --cache-control "${CACHE_CONTROL}" \
      --no-progress`;

    execSync(cmd, { stdio: 'pipe' });
    console.log(`      ✓ ${s3Uri}`);
    return { uploaded: true, skipped: false };
  } catch (error) {
    console.error(`      ✗ Failed: ${error.message}`);
    return { uploaded: false, skipped: false };
  }
}

/**
 * Upload files using S3 sync (faster for many files)
 */
function syncToS3() {
  console.log(`\n🚀 Syncing optimized images to S3...`);
  console.log(`   Bucket: s3://${BUCKET_NAME}/${S3_PREFIX}/`);
  console.log(`   Region: ${AWS_REGION}`);

  if (DRY_RUN) {
    console.log(`   Mode: DRY RUN (no files will be uploaded)\n`);
  } else {
    console.log('');
  }

  const files = getOptimizedImages();

  if (files.length === 0) {
    console.log('ℹ️  No images to upload.');
    return;
  }

  // Group files by post for better logging
  const postGroups = {};
  for (const file of files) {
    if (!postGroups[file.postSlug]) {
      postGroups[file.postSlug] = [];
    }
    postGroups[file.postSlug].push(file);
  }

  let uploadedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const startTime = Date.now();

  for (const [postSlug, postFiles] of Object.entries(postGroups)) {
    console.log(`📁 ${postSlug} (${postFiles.length} files)`);

    for (let i = 0; i < postFiles.length; i++) {
      const result = uploadFile(postFiles[i], i, postFiles.length);
      if (result.uploaded) uploadedCount++;
      if (result.skipped) skippedCount++;
      if (!result.uploaded && !result.skipped) errorCount++;
    }

    console.log('');
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('✅ Upload complete!');
  console.log(`   ${uploadedCount} files uploaded`);
  if (skippedCount > 0) {
    console.log(`   ${skippedCount} files skipped (dry run)`);
  }
  if (errorCount > 0) {
    console.log(`   ❌ ${errorCount} files failed`);
  }
  console.log(`   ${duration}s elapsed`);

  if (!DRY_RUN) {
    console.log(`\n🌐 Images available at:`);
    console.log(`   https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${S3_PREFIX}/`);
    console.log(`   (or via CloudFront once cache propagates)`);
  }
}

/**
 * Alternative: Use aws s3 sync command (faster but less control)
 */
function syncWithAwsCli() {
  console.log(`\n🚀 Syncing optimized images to S3 (using aws s3 sync)...`);
  console.log(`   Source: ${IMAGES_DIR}`);
  console.log(`   Bucket: s3://${BUCKET_NAME}/${S3_PREFIX}/`);
  console.log(`   Region: ${AWS_REGION}`);
  if (AWS_PROFILE) {
    console.log(`   Profile: ${AWS_PROFILE}`);
  }

  if (DRY_RUN) {
    console.log(`   Mode: DRY RUN\n`);
  } else {
    console.log('');
  }

  const dryRunFlag = DRY_RUN ? '--dryrun' : '';
  const profileFlag = AWS_PROFILE ? `--profile ${AWS_PROFILE}` : '';

  try {
    const cmd = `aws s3 sync "${IMAGES_DIR}" "s3://${BUCKET_NAME}/${S3_PREFIX}/" \
      --region ${AWS_REGION} \
      --cache-control "${CACHE_CONTROL}" \
      --size-only \
      ${profileFlag} \
      ${dryRunFlag}`;

    console.log('Running aws s3 sync...\n');
    execSync(cmd, { stdio: 'inherit' });

    console.log('\n✅ Sync complete!');
  } catch (error) {
    console.error('\n❌ Sync failed:', error.message);
    process.exit(1);
  }
}

/**
 * Main execution
 */
function main() {
  console.log('📦 S3 Image Upload Script\n');

  // Check prerequisites
  if (!checkAwsCli()) {
    console.error('❌ AWS CLI not found. Please install it first:');
    console.error('   https://aws.amazon.com/cli/');
    process.exit(1);
  }

  if (!fs.existsSync(IMAGES_DIR)) {
    console.error('❌ Optimized images directory not found.');
    console.error('   Run: npm run optimize-images');
    process.exit(1);
  }

  // Use aws s3 sync for better performance
  // For more control over individual files, use syncToS3() instead
  syncWithAwsCli();
}

// Run the script
main();
