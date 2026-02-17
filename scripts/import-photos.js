/**
 * Import Photos with EXIF Extraction
 *
 * Scans a directory for photos, extracts EXIF metadata, and creates
 * photo posts with proper frontmatter and original image files.
 *
 * Usage:
 *   node scripts/import-photos.js /path/to/photos
 *   node scripts/import-photos.js ~/Desktop/photos --dry-run
 *   node scripts/import-photos.js ./photos --category Photography
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const ExifReader = require('exifreader');

const POSTS_DIR = path.join(process.cwd(), 'content/posts');

// Supported image formats
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.heic', '.heif'];

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  const sourcePath = args.find(arg => !arg.startsWith('--'));
  if (!sourcePath) {
    console.error('❌ Error: Source directory is required\n');
    showHelp();
    process.exit(1);
  }

  return {
    sourcePath: path.resolve(sourcePath),
    dryRun: args.includes('--dry-run'),
    category: getArgValue(args, '--category') || 'Photography',
  };
}

/**
 * Get value for a flag argument
 */
function getArgValue(args, flag) {
  const index = args.indexOf(flag);
  if (index !== -1 && args[index + 1]) {
    return args[index + 1];
  }
  return null;
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
📸 Import Photos with EXIF Extraction

Usage:
  blog photos:import <directory> [options]

Arguments:
  <directory>        Path to directory containing photos

Options:
  --dry-run         Preview what would be imported without creating files
  --category NAME   Set category for imported photos (default: Photography)

Examples:
  blog photos:import ~/Desktop/photos
  blog photos:import ./my-photos --dry-run
  blog photos:import ~/trips/europe --category Travel

Notes:
  - Extracts EXIF metadata (camera, lens, settings, date taken, etc.)
  - Creates one post per photo in content/posts/YYYY-MM-DD-slug/
  - Folder date = today (upload/post date)
  - EXIF dateTaken = actual capture date (preserved in frontmatter)
  - Copies original photo to post folder
  - Generates frontmatter with EXIF data
  - Slugs are generated from filename
`);
}

/**
 * Get all image files from directory
 */
function getImageFiles(dirPath) {
  if (!fs.existsSync(dirPath)) {
    throw new Error(`Directory does not exist: ${dirPath}`);
  }

  const stat = fs.statSync(dirPath);
  if (!stat.isDirectory()) {
    throw new Error(`Not a directory: ${dirPath}`);
  }

  const files = fs.readdirSync(dirPath);
  return files
    .filter(file => {
      const ext = path.extname(file).toLowerCase();
      return IMAGE_EXTENSIONS.includes(ext);
    })
    .map(file => path.join(dirPath, file));
}

/**
 * Extract EXIF metadata from image
 */
async function extractExif(photoPath) {
  try {
    // Read file and parse EXIF
    const tags = ExifReader.load(fs.readFileSync(photoPath));

    // Helper to get tag value
    const getTagValue = (tagName) => {
      const tag = tags[tagName];
      if (!tag) return undefined;
      return tag.description || tag.value;
    };

    // Extract make and model
    const make = getTagValue('Make');
    const model = getTagValue('Model');

    // Build camera string
    let camera = undefined;
    if (make && model) {
      // Remove make from model if it's already included
      const cleanModel = model.replace(make, '').trim();
      camera = `${make} ${cleanModel}`.trim();
    } else if (model) {
      camera = model;
    }

    // Extract lens
    const lens = getTagValue('LensModel') || getTagValue('LensMake');

    // Extract aperture
    let aperture = undefined;
    const fNumber = tags.FNumber;
    if (fNumber && fNumber.description) {
      const desc = fNumber.description;
      // Check if description already starts with "f/"
      aperture = desc.startsWith('f/') ? desc : `f/${desc}`;
    } else if (tags.ApertureValue) {
      const desc = tags.ApertureValue.description;
      aperture = desc.startsWith('f/') ? desc : `f/${desc}`;
    }

    // Extract shutter speed
    let shutterSpeed = undefined;
    const exposureTime = tags.ExposureTime;
    if (exposureTime && exposureTime.description) {
      shutterSpeed = exposureTime.description;
    }

    // Extract ISO
    let iso = undefined;
    const isoValue = getTagValue('ISOSpeedRatings') || getTagValue('ISO');
    if (isoValue) {
      iso = isoValue.toString();
    }

    // Extract focal length
    let focalLength = undefined;
    const focalLengthTag = tags.FocalLength;
    if (focalLengthTag && focalLengthTag.description) {
      focalLength = focalLengthTag.description;
    }

    // Extract date taken
    let dateTaken = undefined;
    const dateTimeOriginal = getTagValue('DateTimeOriginal') || getTagValue('DateTime');
    if (dateTimeOriginal) {
      // Convert EXIF date format (YYYY:MM:DD HH:MM:SS) to ISO format
      dateTaken = dateTimeOriginal.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
    }

    // Get image dimensions using Sharp
    const image = sharp(photoPath);
    const metadata = await image.metadata();

    return {
      camera,
      lens,
      aperture,
      shutterSpeed,
      iso,
      focalLength,
      dateTaken,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
    };
  } catch (error) {
    console.warn(`   ⚠️  Could not extract EXIF from ${path.basename(photoPath)}: ${error.message}`);
    return {};
  }
}

/**
 * Generate slug from filename
 */
function generateSlug(filename) {
  // Remove extension
  const nameWithoutExt = path.parse(filename).name;

  // Clean up filename
  let slug = nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // If slug is just numbers (like IMG_1234 or DSC_0001), make it more descriptive
  if (/^(img|dsc|p)?[-_]?\d+$/i.test(slug)) {
    // Add photo prefix to generic numbered files
    slug = `photo-${slug}`;
  }

  return slug;
}

/**
 * Get today's date for post/upload date (YYYY-MM-DD)
 */
function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generate frontmatter for photo post
 */
function generateFrontmatter(photoData) {
  const { title, date, excerpt, category, tags, photoFilename, exif } = photoData;

  let frontmatter = `---
type: photo
title: "${title}"
publishedAt: "${date}"
excerpt: "${excerpt}"
category: "${category}"
tags: [${tags.map(t => `"${t}"`).join(', ')}]
coverImage: "./${photoFilename}"`;

  // Add EXIF metadata if available
  if (exif.camera) {
    frontmatter += `\ncamera: "${exif.camera}"`;
  }
  if (exif.lens) {
    frontmatter += `\nlens: "${exif.lens}"`;
  }
  if (exif.aperture) {
    frontmatter += `\naperture: "${exif.aperture}"`;
  }
  if (exif.shutterSpeed) {
    frontmatter += `\nshutterSpeed: "${exif.shutterSpeed}"`;
  }
  if (exif.iso) {
    frontmatter += `\niso: "${exif.iso}"`;
  }
  if (exif.focalLength) {
    frontmatter += `\nfocalLength: "${exif.focalLength}"`;
  }
  if (exif.dateTaken) {
    frontmatter += `\ndateTaken: "${exif.dateTaken}"`;
  }

  frontmatter += `
draft: false
---

Optional description or narrative about this photo...
`;

  return frontmatter;
}

/**
 * Import a single photo
 */
async function importPhoto(photoPath, options) {
  const { category, dryRun } = options;
  const filename = path.basename(photoPath);
  const ext = path.extname(photoPath).toLowerCase();

  console.log(`\n📸 Processing: ${filename}`);

  // Extract EXIF
  const exif = await extractExif(photoPath);

  // Generate slug from filename and use today's date for post
  const slug = generateSlug(filename);
  const date = getTodayDate(); // Use current date for post/upload date
  const dirName = `${date}-${slug}`; // Format: YYYY-MM-DD-filename
  const postDir = path.join(POSTS_DIR, dirName);

  // Check if post already exists
  if (fs.existsSync(postDir) && !dryRun) {
    console.log(`   ⚠️  Skipping - directory already exists: ${dirName}`);
    return { skipped: true };
  }

  // Generate title from filename
  const title = path.parse(filename).name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  // Prepare photo data
  const photoData = {
    title,
    date,
    excerpt: exif.camera ? `Photo taken with ${exif.camera}` : 'A new photo',
    category,
    tags: [category.toLowerCase()],
    photoFilename: `photo${ext}`,
    exif,
  };

  if (dryRun) {
    console.log(`   📁 Would create: ${dirName}`);
    console.log(`   📝 Title: ${title}`);
    console.log(`   📅 Post date: ${date}`);
    if (exif.dateTaken) console.log(`   📸 Captured: ${exif.dateTaken}`);
    if (exif.camera) console.log(`   📷 Camera: ${exif.camera}`);
    if (exif.lens) console.log(`   🔍 Lens: ${exif.lens}`);
    if (exif.aperture || exif.shutterSpeed || exif.iso) {
      const settings = [exif.aperture, exif.shutterSpeed, `ISO ${exif.iso}`]
        .filter(Boolean)
        .join(' • ');
      console.log(`   ⚙️  Settings: ${settings}`);
    }
    return { created: true, dryRun: true };
  }

  // Create directory
  fs.mkdirSync(postDir, { recursive: true });

  // Copy photo
  const photoDestPath = path.join(postDir, photoData.photoFilename);
  fs.copyFileSync(photoPath, photoDestPath);

  // Create index.mdx
  const indexPath = path.join(postDir, 'index.mdx');
  const content = generateFrontmatter(photoData);
  fs.writeFileSync(indexPath, content);

  console.log(`   ✅ Created: ${dirName}`);
  console.log(`   📅 Post date: ${date}`);
  if (exif.dateTaken) console.log(`   📸 Captured: ${exif.dateTaken}`);
  console.log(`   📷 Photo: ${photoData.photoFilename}`);
  console.log(`   📝 Post: index.mdx`);

  return {
    created: true,
    dirName,
    postDir,
    indexPath,
    photoPath: photoDestPath,
  };
}

/**
 * Main execution
 */
async function main() {
  console.log('📸 Import Photos with EXIF Extraction\n');

  const options = parseArgs();

  console.log(`📁 Source: ${options.sourcePath}`);
  console.log(`📂 Target: ${POSTS_DIR}`);
  console.log(`🏷️  Category: ${options.category}`);
  if (options.dryRun) {
    console.log('🔍 Mode: DRY RUN (no files will be created)');
  }

  // Get image files
  let imageFiles;
  try {
    imageFiles = getImageFiles(options.sourcePath);
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  }

  if (imageFiles.length === 0) {
    console.log('\n⚠️  No image files found in directory');
    console.log(`   Supported formats: ${IMAGE_EXTENSIONS.join(', ')}\n`);
    process.exit(0);
  }

  console.log(`\n📊 Found ${imageFiles.length} image(s)\n`);

  // Ensure posts directory exists
  if (!fs.existsSync(POSTS_DIR) && !options.dryRun) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
  }

  // Import each photo
  const results = {
    created: 0,
    skipped: 0,
    errors: 0,
  };

  for (const photoPath of imageFiles) {
    try {
      const result = await importPhoto(photoPath, options);
      if (result.created) results.created++;
      if (result.skipped) results.skipped++;
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      results.errors++;
    }
  }

  // Summary
  console.log('\n' + '─'.repeat(50));
  console.log('\n📊 Import Summary:');
  console.log(`   ✅ Created: ${results.created}`);
  if (results.skipped > 0) {
    console.log(`   ⏭️  Skipped: ${results.skipped}`);
  }
  if (results.errors > 0) {
    console.log(`   ❌ Errors: ${results.errors}`);
  }

  if (options.dryRun) {
    console.log('\n💡 This was a dry run. Remove --dry-run to create the posts.');
  } else if (results.created > 0) {
    console.log('\n💡 Next steps:');
    console.log('   1. Review and edit the generated posts');
    console.log('   2. Run: blog images:optimize');
    console.log('   3. Run: blog images:sync --profile www');
  }

  console.log('');
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
