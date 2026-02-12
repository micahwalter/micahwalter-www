/**
 * Sync Images - All-in-one workflow
 *
 * Performs a complete image workflow:
 * 1. Optimizes images locally (if originals exist)
 * 2. Uploads both originals and processed to S3
 *
 * Usage:
 *   node scripts/sync-images.js                  # Full sync
 *   node scripts/sync-images.js --dry-run        # Preview mode
 *   node scripts/sync-images.js --profile www    # Use specific AWS profile
 */

const { execSync } = require('child_process');
const path = require('path');

// Parse command-line arguments
const args = process.argv.slice(2);
const extraArgs = args.join(' ');

function runScript(scriptName, description) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${description}`);
  console.log('='.repeat(60));

  const scriptPath = path.join(__dirname, scriptName);

  try {
    execSync(`node "${scriptPath}" ${extraArgs}`, { stdio: 'inherit' });
  } catch (error) {
    console.error(`\n❌ Failed during: ${description}`);
    process.exit(1);
  }
}

function main() {
  console.log('🔄 Image Sync Workflow\n');

  const startTime = Date.now();

  // Step 1: Optimize images
  runScript('optimize-images.js', '1️⃣  Optimizing Images');

  // Step 2: Upload to S3
  runScript('upload-images.js', '2️⃣  Uploading to S3');

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Sync complete! (${duration}s)`);
  console.log('='.repeat(60));

  console.log('\n💡 Your images are now:');
  console.log('   ✓ Optimized locally');
  console.log('   ✓ Backed up to S3 (originals + processed)');
  console.log('   ✓ Ready for use on any machine\n');
}

main();
