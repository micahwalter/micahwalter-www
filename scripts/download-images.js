/**
 * Download Images from S3
 *
 * Downloads original and/or processed images from S3 to local directories.
 * Useful when setting up the project on a new machine.
 *
 * Usage:
 *   node scripts/download-images.js                    # Download both originals and processed
 *   node scripts/download-images.js --dry-run          # Preview what would be downloaded
 *   node scripts/download-images.js --profile www      # Use specific AWS profile
 *   node scripts/download-images.js --originals-only   # Only download originals
 *   node scripts/download-images.js --processed-only   # Only download processed
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
const BUCKET_NAME = process.env.IMAGES_BUCKET || process.env.IMAGES_BUCKET_NAME;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// S3 prefixes
const ORIGINALS_PREFIX = 'images/originals/posts';
const PROCESSED_PREFIX = 'images/posts';

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
 * Check if S3 path exists
 */
function s3PathExists(s3Path) {
  const profileFlag = AWS_PROFILE ? `--profile ${AWS_PROFILE}` : '';
  try {
    execSync(`aws s3 ls "${s3Path}" --region ${AWS_REGION} ${profileFlag}`, {
      stdio: 'pipe'
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Download originals from S3
 */
function downloadOriginals() {
  if (PROCESSED_ONLY) {
    console.log('ℹ️  Skipping originals (--processed-only flag)\n');
    return;
  }

  const s3Path = `s3://${BUCKET_NAME}/${ORIGINALS_PREFIX}/`;

  console.log('📁 Downloading original images...');
  console.log(`   Source: ${s3Path}`);
  console.log(`   Dest:   ${POSTS_DIR}`);

  // Check if S3 path exists
  if (!s3PathExists(s3Path)) {
    console.log('   ⚠️  No originals found in S3 (this is okay if you haven\'t uploaded yet)\n');
    return;
  }

  // Ensure destination exists
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
  }

  const dryRunFlag = DRY_RUN ? '--dryrun' : '';
  const profileFlag = AWS_PROFILE ? `--profile ${AWS_PROFILE}` : '';

  try {
    const cmd = `aws s3 sync "${s3Path}" "${POSTS_DIR}" \
      --region ${AWS_REGION} \
      --exclude "*.md" \
      --exclude "index.md" \
      ${profileFlag} \
      ${dryRunFlag}`;

    execSync(cmd, { stdio: 'inherit' });
    console.log('   ✅ Originals downloaded\n');
  } catch (error) {
    console.error('   ❌ Failed to download originals:', error.message);
    throw error;
  }
}

/**
 * Download processed images from S3
 */
function downloadProcessed() {
  if (ORIGINALS_ONLY) {
    console.log('ℹ️  Skipping processed images (--originals-only flag)\n');
    return;
  }

  const s3Path = `s3://${BUCKET_NAME}/${PROCESSED_PREFIX}/`;

  console.log('🖼️  Downloading processed images...');
  console.log(`   Source: ${s3Path}`);
  console.log(`   Dest:   ${PROCESSED_DIR}`);

  // Check if S3 path exists
  if (!s3PathExists(s3Path)) {
    console.log('   ⚠️  No processed images found in S3\n');
    console.log('   💡 Tip: Run "blog images:optimize" to generate them locally\n');
    return;
  }

  // Ensure destination exists
  if (!fs.existsSync(PROCESSED_DIR)) {
    fs.mkdirSync(PROCESSED_DIR, { recursive: true });
  }

  const dryRunFlag = DRY_RUN ? '--dryrun' : '';
  const profileFlag = AWS_PROFILE ? `--profile ${AWS_PROFILE}` : '';

  try {
    const cmd = `aws s3 sync "${s3Path}" "${PROCESSED_DIR}" \
      --region ${AWS_REGION} \
      ${profileFlag} \
      ${dryRunFlag}`;

    execSync(cmd, { stdio: 'inherit' });
    console.log('   ✅ Processed images downloaded\n');
  } catch (error) {
    console.error('   ❌ Failed to download processed images:', error.message);
    throw error;
  }
}

/**
 * Main execution
 */
function main() {
  console.log('📥 Download Images from S3\n');

  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No files will be downloaded\n');
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

  // Download originals
  downloadOriginals();

  // Download processed
  downloadProcessed();

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('✅ Download complete!');
  console.log(`   Duration: ${duration}s`);

  if (!DRY_RUN && !PROCESSED_ONLY) {
    console.log('\n💡 Next steps:');
    console.log('   - Original images are in: content/posts/');
    if (!ORIGINALS_ONLY) {
      console.log('   - Processed images are in: .optimized-images/posts/');
    }
    if (ORIGINALS_ONLY) {
      console.log('   - Run "blog images:optimize" to generate processed versions');
    }
  }
}

// Run the script
main();
