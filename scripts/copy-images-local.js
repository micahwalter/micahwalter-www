/**
 * Copy Optimized Images to Public Directory
 *
 * Copies optimized images from .optimized-images/ to public/images/
 * for local development. This allows Next.js dev server to serve the images.
 *
 * In production, images are served from S3/CloudFront instead.
 */

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(process.cwd(), '.optimized-images/posts');
const destDir = path.join(process.cwd(), 'public/images/posts');

/**
 * Recursively copy directory contents
 */
function copyDirectory(source, destination) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  const entries = fs.readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destPath);
    } else {
      // Only copy if source is newer or dest doesn't exist
      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`  ✓ Copied ${entry.name}`);
      } else {
        const sourceStats = fs.statSync(sourcePath);
        const destStats = fs.statSync(destPath);

        if (sourceStats.mtime > destStats.mtime) {
          fs.copyFileSync(sourcePath, destPath);
          console.log(`  ✓ Updated ${entry.name}`);
        }
      }
    }
  }
}

/**
 * Main execution
 */
function main() {
  console.log('📋 Copying optimized images to public directory...\n');

  // Check if source directory exists
  if (!fs.existsSync(sourceDir)) {
    console.error('❌ Optimized images not found.');
    console.error('   Run: npm run optimize-images');
    process.exit(1);
  }

  const startTime = Date.now();

  // Get all post directories
  const postDirs = fs.readdirSync(sourceDir).filter(folder => {
    const fullPath = path.join(sourceDir, folder);
    return fs.statSync(fullPath).isDirectory();
  });

  if (postDirs.length === 0) {
    console.log('ℹ️  No images to copy.');
    return;
  }

  // Copy each post directory
  for (const postDir of postDirs) {
    const sourcePath = path.join(sourceDir, postDir);
    const destPath = path.join(destDir, postDir);

    console.log(`📁 ${postDir}`);
    copyDirectory(sourcePath, destPath);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n✅ Copy complete!');
  console.log(`   ${postDirs.length} post directories processed`);
  console.log(`   ${duration}s elapsed`);
  console.log('\n💡 Images are now available at /images/posts/ for local development');
}

// Run the script
main();
