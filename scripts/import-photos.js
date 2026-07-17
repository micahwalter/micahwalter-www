/**
 * Import Photos → DynamoDB (API/DB source of truth).
 *
 * Scans a directory for photos, extracts EXIF, allocates ticket ids, writes
 * PhotoRecords to DynamoDB, and stages the original under content/posts for
 * blog images:optimize + images:sync (no index.md).
 *
 * Usage:
 *   node scripts/import-photos.js /path/to/photos
 *   node scripts/import-photos.js ~/Desktop/photos --dry-run
 *   node scripts/import-photos.js ./photos --category Photography --featured
 *
 * Env:
 *   PHOTOS_TABLE (default micahwalter-photos)
 *   AWS_PROFILE / AWS_REGION
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const ExifReader = require('exifreader');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { allocatePostId } = require('./lib/allocate-post-id');

const POSTS_DIR = path.join(process.cwd(), 'content/posts');
const TABLE = process.env.PHOTOS_TABLE || 'micahwalter-photos';
const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.heic', '.heif'];

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }), {
  marshallOptions: { removeUndefinedValues: true },
});

function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  const sourcePath = args.find((arg) => !arg.startsWith('--'));
  if (!sourcePath) {
    console.error('❌ Error: Source directory is required\n');
    showHelp();
    process.exit(1);
  }

  return {
    sourcePath: path.resolve(sourcePath),
    dryRun: args.includes('--dry-run'),
    category: getArgValue(args, '--category') || 'Photography',
    featured: args.includes('--featured'),
  };
}

function getArgValue(args, flag) {
  const index = args.indexOf(flag);
  if (index !== -1 && args[index + 1]) return args[index + 1];
  return null;
}

function showHelp() {
  console.log(`
📸 Import Photos → DynamoDB (no photo markdown)

Usage:
  blog photos:import <directory> [options]

Arguments:
  <directory>        Path to directory containing photos

Options:
  --dry-run         Preview without writing DynamoDB or files
  --category NAME   Category / default tag (default: Photography)
  --featured        Flag imported photo(s) as homepage featured

Examples:
  blog photos:import ~/Desktop/photos
  blog photos:import ./my-photos --dry-run
  blog photos:import ~/trips/europe --category Travel --featured

Notes:
  - Allocates ids via the ticket server
  - Writes PhotoRecord to DynamoDB (source of truth)
  - Stages original image under content/posts/<folder>/ for images:optimize + sync
  - Does NOT create index.md
  - Public URL: /photos/<id>
`);
}

function getImageFiles(dirPath) {
  if (!fs.existsSync(dirPath)) {
    throw new Error(`Directory does not exist: ${dirPath}`);
  }
  const files = fs.readdirSync(dirPath);
  return files
    .filter((file) => IMAGE_EXTENSIONS.includes(path.extname(file).toLowerCase()))
    .map((file) => path.join(dirPath, file))
    .sort();
}

async function extractExif(photoPath) {
  try {
    const buffer = fs.readFileSync(photoPath);
    const tags = ExifReader.load(buffer);
    const getTagValue = (name) => {
      const tag = tags[name];
      if (!tag) return undefined;
      return tag.description || tag.value;
    };

    const make = getTagValue('Make');
    const model = getTagValue('Model');
    const camera = [make, model].filter(Boolean).join(' ') || undefined;
    const lens = getTagValue('LensModel') || getTagValue('Lens') || undefined;
    const aperture = getTagValue('FNumber') || getTagValue('ApertureValue');
    const shutterSpeed = getTagValue('ExposureTime') || getTagValue('ShutterSpeedValue');
    const iso = getTagValue('ISOSpeedRatings') || getTagValue('PhotographicSensitivity');
    const focalLength = getTagValue('FocalLength');

    let dateTaken;
    const dateTimeOriginal = getTagValue('DateTimeOriginal') || getTagValue('DateTime');
    if (dateTimeOriginal) {
      dateTaken = String(dateTimeOriginal).replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
    }

    const image = sharp(photoPath);
    const metadata = await image.metadata();

    return {
      camera,
      lens,
      aperture: aperture ? `f/${aperture}` : undefined,
      shutterSpeed,
      iso: iso != null ? String(iso) : undefined,
      focalLength: focalLength ? String(focalLength) : undefined,
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

function generateSlug(filename) {
  const nameWithoutExt = path.parse(filename).name;
  let slug = nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (/^(img|dsc|p)?[-_]?\d+$/i.test(slug)) {
    slug = `photo-${slug}`;
  }
  return slug;
}

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function nowIso() {
  return new Date().toISOString();
}

function gsiKeys(publishedAt, id) {
  return {
    gsi1pk: 'PHOTO',
    gsi1sk: `${publishedAt}#${id}`,
  };
}

async function importPhoto(photoPath, options) {
  const { category, dryRun, previewId, featured } = options;
  const filename = path.basename(photoPath);
  const ext = path.extname(photoPath).toLowerCase();

  console.log(`\n📸 Processing: ${filename}`);

  const exif = await extractExif(photoPath);
  const id = dryRun ? previewId : await allocatePostId();
  const slug = generateSlug(filename);
  const date = getTodayDate();
  const dirName = `${date}-${slug}`;
  const postDir = path.join(POSTS_DIR, dirName);
  const photoFilename = `photo${ext === '.jpeg' ? '.jpeg' : ext}`;

  if (fs.existsSync(postDir) && !dryRun) {
    console.log(`   ⚠️  Skipping - directory already exists: ${dirName}`);
    return { skipped: true };
  }

  const title = path
    .parse(filename)
    .name.replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const caption = exif.camera ? `Photo taken with ${exif.camera}` : '';

  const photo = {
    id: String(id),
    ...gsiKeys(date, String(id)),
    title,
    caption,
    publishedAt: date,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    featured: !!featured,
    draft: false,
    tags: [category.toLowerCase()],
    enrichmentStatus: 'pending',
    folderName: dirName,
    coverImageKey: `images/posts/${dirName}/${photoFilename}`,
    originalKey: `images/originals/posts/${dirName}/${photoFilename}`,
    category,
    exif,
    latitude: null,
    longitude: null,
    publicLatitude: null,
    publicLongitude: null,
  };

  if (dryRun) {
    console.log(`   📁 Would stage: ${dirName}/${photoFilename}`);
    console.log(`   🔢 Photo ID: ${id} → URL: /photos/${id}`);
    console.log(`   📝 Title: ${title}`);
    if (featured) console.log(`   ⭐ Featured on homepage`);
    console.log(`   📅 Post date: ${date}`);
    if (exif.dateTaken) console.log(`   📸 Captured: ${exif.dateTaken}`);
    if (exif.camera) console.log(`   📷 Camera: ${exif.camera}`);
    return { created: true, dryRun: true };
  }

  fs.mkdirSync(postDir, { recursive: true });
  const photoDestPath = path.join(postDir, photoFilename);
  fs.copyFileSync(photoPath, photoDestPath);

  await ddb.send(new PutCommand({ TableName: TABLE, Item: photo }));

  console.log(`   ✅ DynamoDB upsert + staged image: ${dirName}`);
  console.log(`   🔢 Photo ID: ${id} → URL: /photos/${id}`);
  console.log(`   📅 Post date: ${date}`);
  if (exif.dateTaken) console.log(`   📸 Captured: ${exif.dateTaken}`);
  console.log(`   📷 Photo: ${photoFilename} (no index.md)`);

  return { created: true, dirName, id };
}

async function main() {
  console.log('📸 Import Photos → DynamoDB\n');

  const options = parseArgs();

  console.log(`📁 Source: ${options.sourcePath}`);
  console.log(`🗄️  Table: ${TABLE} (${REGION})`);
  console.log(`🏷️  Category: ${options.category}`);
  if (options.dryRun) {
    console.log('🔍 Mode: DRY RUN');
  }

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

  if (!fs.existsSync(POSTS_DIR) && !options.dryRun) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
  }

  const results = { created: 0, skipped: 0, errors: 0 };
  let dryRunNextId = Date.now() % 100000;

  for (const photoPath of imageFiles) {
    try {
      dryRunNextId++;
      const result = await importPhoto(photoPath, {
        ...options,
        previewId: dryRunNextId,
      });
      if (result.created) results.created++;
      if (result.skipped) results.skipped++;
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      results.errors++;
    }
  }

  console.log('\n' + '─'.repeat(50));
  console.log('\n📊 Import Summary:');
  console.log(`   ✅ Created: ${results.created}`);
  if (results.skipped > 0) console.log(`   ⏭️  Skipped: ${results.skipped}`);
  if (results.errors > 0) console.log(`   ❌ Errors: ${results.errors}`);

  if (options.dryRun) {
    console.log('\n💡 This was a dry run. Remove --dry-run to import.');
  } else if (results.created > 0) {
    console.log('\n💡 Next steps:');
    console.log('   1. Run: blog images:optimize');
    console.log('   2. Run: blog images:sync --profile www');
    console.log('   3. Photos appear at /photos/<id> via the API (no site rebuild required for metadata)');
  }

  console.log('');
  if (results.errors) process.exit(1);
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
