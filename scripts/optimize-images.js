/**
 * Image Optimization Script
 *
 * Processes all images in content/posts/ and generates:
 * - WebP versions at 400px, 800px, 1200px
 * - JPEG fallbacks at 400px, 800px, 1200px
 *
 * Output: .optimized-images/posts/[slug]/[filename]-[size].[format]
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SIZES = [400, 800, 1200];
const WEBP_QUALITY = 85;
const JPEG_QUALITY = 85;

const postsDir = path.join(process.cwd(), 'content/posts');
const outputDir = path.join(process.cwd(), '.optimized-images/posts');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Supported image formats
const imageExtensions = /\.(jpg|jpeg|png)$/i;

/**
 * Get all post directories
 */
function getPostDirs() {
  return fs.readdirSync(postsDir).filter(folder => {
    const fullPath = path.join(postsDir, folder);
    return fs.statSync(fullPath).isDirectory();
  });
}

/**
 * Get all image files in a post directory
 */
function getImageFiles(postDir) {
  const postPath = path.join(postsDir, postDir);
  return fs.readdirSync(postPath).filter(file =>
    imageExtensions.test(file)
  );
}

/**
 * Check if optimized image needs regeneration
 */
function needsOptimization(sourcePath, outputPath) {
  if (!fs.existsSync(outputPath)) {
    return true;
  }

  const sourceStats = fs.statSync(sourcePath);
  const outputStats = fs.statSync(outputPath);

  // Regenerate if source is newer than output
  return sourceStats.mtime > outputStats.mtime;
}

/**
 * Optimize a single image to multiple sizes and formats
 */
async function optimizeImage(postSlug, imageFile) {
  const sourcePath = path.join(postsDir, postSlug, imageFile);
  const baseFilename = path.parse(imageFile).name;
  const postOutputDir = path.join(outputDir, postSlug);

  // Create post output directory
  if (!fs.existsSync(postOutputDir)) {
    fs.mkdirSync(postOutputDir, { recursive: true });
  }

  let processedCount = 0;
  let skippedCount = 0;

  // Get original image metadata
  const metadata = await sharp(sourcePath).metadata();

  for (const size of SIZES) {
    // Skip if image is smaller than target size
    if (metadata.width < size && metadata.height < size) {
      console.log(`  ⏭️  Skipping ${size}px (original is ${metadata.width}x${metadata.height})`);
      continue;
    }

    // Generate WebP
    const webpFilename = `${baseFilename}-${size}.webp`;
    const webpPath = path.join(postOutputDir, webpFilename);

    if (needsOptimization(sourcePath, webpPath)) {
      await sharp(sourcePath)
        .resize(size, size, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: WEBP_QUALITY })
        .toFile(webpPath);

      processedCount++;
      const webpStats = fs.statSync(webpPath);
      console.log(`  ✓ Generated ${webpFilename} (${formatBytes(webpStats.size)})`);
    } else {
      skippedCount++;
    }

    // Generate JPEG fallback
    const jpegFilename = `${baseFilename}-${size}.jpg`;
    const jpegPath = path.join(postOutputDir, jpegFilename);

    if (needsOptimization(sourcePath, jpegPath)) {
      await sharp(sourcePath)
        .resize(size, size, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: JPEG_QUALITY })
        .toFile(jpegPath);

      processedCount++;
      const jpegStats = fs.statSync(jpegPath);
      console.log(`  ✓ Generated ${jpegFilename} (${formatBytes(jpegStats.size)})`);
    } else {
      skippedCount++;
    }
  }

  return { processed: processedCount, skipped: skippedCount };
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Main execution
 */
async function main() {
  console.log('🖼️  Starting image optimization...\n');

  const startTime = Date.now();
  const postDirs = getPostDirs();

  let totalProcessed = 0;
  let totalSkipped = 0;
  let totalImages = 0;

  for (const postDir of postDirs) {
    const images = getImageFiles(postDir);

    if (images.length === 0) {
      continue;
    }

    console.log(`📁 ${postDir} (${images.length} image${images.length > 1 ? 's' : ''})`);

    for (const imageFile of images) {
      totalImages++;
      const stats = await optimizeImage(postDir, imageFile);
      totalProcessed += stats.processed;
      totalSkipped += stats.skipped;
    }

    console.log('');
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('✅ Image optimization complete!');
  console.log(`   ${totalImages} source images processed`);
  console.log(`   ${totalProcessed} files generated`);
  console.log(`   ${totalSkipped} files skipped (up to date)`);
  console.log(`   ${duration}s elapsed`);

  // Output directory info
  const outputSize = getDirectorySize(outputDir);
  console.log(`   Output size: ${formatBytes(outputSize)}`);
}

/**
 * Get total size of directory recursively
 */
function getDirectorySize(dir) {
  if (!fs.existsSync(dir)) return 0;

  let size = 0;
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      size += getDirectorySize(filePath);
    } else {
      size += stats.size;
    }
  }

  return size;
}

// Run the script
main().catch(err => {
  console.error('❌ Error optimizing images:', err);
  process.exit(1);
});
