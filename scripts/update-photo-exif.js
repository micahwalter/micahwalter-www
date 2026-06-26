#!/usr/bin/env node

/**
 * Update Photo EXIF - Extract EXIF metadata from an existing photo post
 *
 * Reads the image from an existing post folder, extracts EXIF metadata,
 * and updates the post's frontmatter in place.
 *
 * Usage:
 *   blog photos:update-exif <slug>
 *   blog photos:update-exif 2026-02-16-photo-img-0803 --dry-run
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const ExifReader = require('exifreader');
const matter = require('gray-matter');

const POSTS_DIR = path.join(process.cwd(), 'content/posts');

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.heic', '.heif'];

function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  const slug = args.find(arg => !arg.startsWith('--'));
  if (!slug) {
    console.error('Error: Post slug is required\n');
    showHelp();
    process.exit(1);
  }

  return {
    slug,
    dryRun: args.includes('--dry-run'),
  };
}

function showHelp() {
  console.log(`
Update Photo EXIF

Extracts EXIF metadata from the image in an existing photo post and
updates the post's frontmatter with camera, lens, aperture, shutter
speed, ISO, focal length, and date taken.

Usage:
  blog photos:update-exif <slug> [options]

Arguments:
  <slug>        Post folder name (e.g. 2026-02-16-photo-img-0803)

Options:
  --dry-run     Show what would be updated without writing changes

Examples:
  blog photos:update-exif 2026-02-16-photo-img-0803
  blog photos:update-exif 2026-02-16-photo-img-0803 --dry-run
`);
}

function findImage(postDir) {
  const files = fs.readdirSync(postDir);
  return files.find(f => IMAGE_EXTENSIONS.includes(path.extname(f).toLowerCase()));
}

async function extractExif(photoPath) {
  try {
    const tags = ExifReader.load(fs.readFileSync(photoPath));

    const getTagValue = (tagName) => {
      const tag = tags[tagName];
      if (!tag) return undefined;
      return tag.description || tag.value;
    };

    const make = getTagValue('Make');
    const model = getTagValue('Model');

    let camera = undefined;
    if (make && model) {
      const cleanModel = model.replace(make, '').trim();
      camera = `${make} ${cleanModel}`.trim();
    } else if (model) {
      camera = model;
    }

    const lens = getTagValue('LensModel') || getTagValue('LensMake');

    let aperture = undefined;
    const fNumber = tags.FNumber;
    if (fNumber && fNumber.description) {
      const desc = fNumber.description;
      aperture = desc.startsWith('f/') ? desc : `f/${desc}`;
    } else if (tags.ApertureValue) {
      const desc = tags.ApertureValue.description;
      aperture = desc.startsWith('f/') ? desc : `f/${desc}`;
    }

    let shutterSpeed = undefined;
    const exposureTime = tags.ExposureTime;
    if (exposureTime && exposureTime.description) {
      shutterSpeed = exposureTime.description;
    }

    let iso = undefined;
    const isoValue = getTagValue('ISOSpeedRatings') || getTagValue('ISO');
    if (isoValue) {
      iso = isoValue.toString();
    }

    let focalLength = undefined;
    const focalLengthTag = tags.FocalLength;
    if (focalLengthTag && focalLengthTag.description) {
      focalLength = focalLengthTag.description;
    }

    let dateTaken = undefined;
    const dateTimeOriginal = getTagValue('DateTimeOriginal') || getTagValue('DateTime');
    if (dateTimeOriginal) {
      dateTaken = dateTimeOriginal.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
    }

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
    };
  } catch (error) {
    console.warn(`Warning: Could not extract EXIF from ${path.basename(photoPath)}: ${error.message}`);
    return {};
  }
}

async function main() {
  const { slug, dryRun } = parseArgs();

  const postDir = path.join(POSTS_DIR, slug);
  if (!fs.existsSync(postDir)) {
    console.error(`Error: Post folder not found: ${postDir}`);
    process.exit(1);
  }

  const mdxPath = path.join(postDir, 'index.md');
  if (!fs.existsSync(mdxPath)) {
    console.error(`Error: index.md not found in ${slug}`);
    process.exit(1);
  }

  const imageFile = findImage(postDir);
  if (!imageFile) {
    console.error(`Error: No image found in ${slug} (looked for ${IMAGE_EXTENSIONS.join(', ')})`);
    process.exit(1);
  }

  const imagePath = path.join(postDir, imageFile);
  console.log(`Post:  ${slug}`);
  console.log(`Image: ${imageFile}`);

  const exif = await extractExif(imagePath);

  if (Object.keys(exif).length === 0) {
    console.log('No EXIF data found in image.');
    process.exit(0);
  }

  // Show extracted data
  console.log('\nExtracted EXIF:');
  if (exif.camera)      console.log(`  camera:       ${exif.camera}`);
  if (exif.lens)        console.log(`  lens:         ${exif.lens}`);
  if (exif.aperture)    console.log(`  aperture:     ${exif.aperture}`);
  if (exif.shutterSpeed) console.log(`  shutterSpeed: ${exif.shutterSpeed}`);
  if (exif.iso)         console.log(`  iso:          ${exif.iso}`);
  if (exif.focalLength) console.log(`  focalLength:  ${exif.focalLength}`);
  if (exif.dateTaken)   console.log(`  dateTaken:    ${exif.dateTaken}`);

  if (dryRun) {
    console.log('\nDry run — no changes written.');
    return;
  }

  // Parse existing frontmatter and merge EXIF fields
  const raw = fs.readFileSync(mdxPath, 'utf8');
  const parsed = matter(raw);

  const updated = { ...parsed.data };
  if (exif.camera)       updated.camera = exif.camera;
  if (exif.lens)         updated.lens = exif.lens;
  if (exif.aperture)     updated.aperture = exif.aperture;
  if (exif.shutterSpeed) updated.shutterSpeed = exif.shutterSpeed;
  if (exif.iso)          updated.iso = exif.iso;
  if (exif.focalLength)  updated.focalLength = exif.focalLength;
  if (exif.dateTaken)    updated.dateTaken = exif.dateTaken;

  const output = matter.stringify(parsed.content, updated);
  fs.writeFileSync(mdxPath, output);

  console.log('\nFrontmatter updated.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
