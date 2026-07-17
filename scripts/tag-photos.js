/**
 * AI Photo Tagging against DynamoDB-backed photos (Bedrock Vision).
 *
 * Usage:
 *   blog photos:tag <id>
 *   blog photos:tag --all
 *   blog photos:tag --all --auto-approve --profile www
 *   blog photos:tag 2026-02-16-sunset-park   # legacy markdown folder (if still present)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const { BedrockRuntimeClient, ConverseCommand } = require('@aws-sdk/client-bedrock-runtime');
const { fromIni } = require('@aws-sdk/credential-providers');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  UpdateCommand,
} = require('@aws-sdk/lib-dynamodb');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const matter = require('gray-matter');

const POSTS_DIR = path.join(process.cwd(), 'content/posts');
const TABLE = process.env.PHOTOS_TABLE || 'micahwalter-photos';
const IMAGES_BUCKET = process.env.IMAGES_BUCKET || 'micahwalter-www-images';
const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

function parseArgs() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  const profileIndex = args.indexOf('--profile');
  const profile =
    profileIndex !== -1 && args[profileIndex + 1]
      ? args[profileIndex + 1]
      : process.env.AWS_PROFILE;
  const profileValue = profileIndex !== -1 ? args[profileIndex + 1] : null;
  const target =
    args.find((arg) => !arg.startsWith('--') && arg !== profileValue) || null;

  return {
    target,
    all: args.includes('--all'),
    autoApprove: args.includes('--auto-approve'),
    dryRun: args.includes('--dry-run'),
    untaggedOnly: args.includes('--untagged-only'),
    profile,
  };
}

function showHelp() {
  console.log(`
📸 AI Photo Tagging (DynamoDB / Bedrock)

Usage:
  blog photos:tag <id>
  blog photos:tag --all [options]
  blog photos:tag <post-folder>   # legacy markdown folder

Options:
  --profile <name> AWS profile (default: AWS_PROFILE or www)
  --auto-approve   Apply suggested tags without confirmation
  --untagged-only  Only process photos with minimal tags
  --dry-run        Show suggestions without updating

Examples:
  blog photos:tag 157 --profile www
  blog photos:tag --all --auto-approve --profile www
`);
}

function awsClients(profile) {
  const cfg = { region: REGION };
  if (profile) cfg.credentials = fromIni({ profile });
  return {
    ddb: DynamoDBDocumentClient.from(new DynamoDBClient(cfg), {
      marshallOptions: { removeUndefinedValues: true },
    }),
    s3: new S3Client(cfg),
    bedrock: new BedrockRuntimeClient({ region: 'us-east-1', ...(profile ? { credentials: fromIni({ profile }) } : {}) }),
  };
}

async function streamToBuffer(stream) {
  const bytes = await stream.transformToByteArray();
  return Buffer.from(bytes);
}

async function getPhoto(ddb, id) {
  const res = await ddb.send(new GetCommand({ TableName: TABLE, Key: { id: String(id) } }));
  return res.Item || null;
}

async function listAllPhotos(ddb) {
  const items = [];
  let ExclusiveStartKey;
  do {
    const res = await ddb.send(
      new QueryCommand({
        TableName: TABLE,
        IndexName: 'GSI1',
        KeyConditionExpression: 'gsi1pk = :pk',
        ExpressionAttributeValues: { ':pk': 'PHOTO' },
        ScanIndexForward: false,
        ExclusiveStartKey,
      }),
    );
    items.push(...(res.Items || []));
    ExclusiveStartKey = res.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return items;
}

async function downloadPhotoBuffer(s3, photo) {
  const keys = [];
  if (photo.coverImageKey) {
    const base = photo.coverImageKey.replace(/\.[^.]+$/, '');
    keys.push(`${base}-1200.jpg`, photo.coverImageKey);
  }
  if (photo.folderName) {
    keys.push(
      `images/posts/${photo.folderName}/photo-1200.jpg`,
      `images/originals/posts/${photo.folderName}/photo.jpg`,
      `images/originals/posts/${photo.folderName}/photo.jpeg`,
    );
  }
  for (const key of [...new Set(keys)]) {
    try {
      const obj = await s3.send(new GetObjectCommand({ Bucket: IMAGES_BUCKET, Key: key }));
      return await streamToBuffer(obj.Body);
    } catch {
      /* next */
    }
  }
  throw new Error('Could not download photo bytes from S3');
}

async function analyzeBuffer(bedrock, imageBuffer) {
  const sharp = require('sharp');
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const maxDimension = 1600;
  const shouldResize =
    (metadata.width || 0) > maxDimension || (metadata.height || 0) > maxDimension;
  const bytes = shouldResize
    ? await image
        .resize(maxDimension, maxDimension, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer()
    : imageBuffer;

  console.log('   🤖 Analyzing with Claude Vision via Bedrock...');
  const response = await bedrock.send(
    new ConverseCommand({
      modelId: 'us.anthropic.claude-sonnet-4-6',
      messages: [
        {
          role: 'user',
          content: [
            { image: { format: 'jpeg', source: { bytes } } },
            {
              text: `Analyze this photo and suggest 3-8 relevant tags (comma-separated, lowercase, hyphens for multi-word). Tags:`,
            },
          ],
        },
      ],
      inferenceConfig: { maxTokens: 1024 },
    }),
  );
  const responseText = response.output.message.content[0].text.trim();
  return responseText
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0 && tag.length < 30);
}

async function updateDbTags(ddb, id, newTags, existing) {
  const merged = [...new Set([...(existing || []), ...newTags])];
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { id: String(id) },
      UpdateExpression: 'SET tags = :t, updatedAt = :u',
      ExpressionAttributeValues: {
        ':t': merged,
        ':u': new Date().toISOString(),
      },
      ConditionExpression: 'attribute_exists(id)',
    }),
  );
  return merged;
}

function isUntagged(tags) {
  return (
    !tags ||
    tags.length === 0 ||
    (tags.length === 1 && String(tags[0]).toLowerCase() === 'photography')
  );
}

async function processDbPhoto(photo, options, clients) {
  console.log(`\n📸 Processing id=${photo.id} (${photo.title || photo.folderName || ''})`);
  console.log(`   🏷️  Current tags: ${(photo.tags || []).join(', ') || 'none'}`);

  if (options.untaggedOnly && !isUntagged(photo.tags)) {
    console.log('   ⏭️  Already tagged, skipping');
    return { skipped: true };
  }

  let suggestedTags;
  try {
    const buf = await downloadPhotoBuffer(clients.s3, photo);
    suggestedTags = await analyzeBuffer(clients.bedrock, buf);
  } catch (error) {
    console.error(`   ❌ Error analyzing photo: ${error.message}`);
    return { error: true };
  }

  console.log(`   ✨ Suggested tags: ${suggestedTags.join(', ')}`);

  if (options.dryRun) {
    console.log('   🔍 [DRY RUN] Would add these tags');
    return { dryRun: true };
  }

  let approve = options.autoApprove;
  if (!approve) {
    const answer = await prompt('   Apply these tags? (Y/n/edit): ');
    if (answer.toLowerCase() === 'edit' || answer.toLowerCase() === 'e') {
      const customTags = await prompt('   Enter tags (comma-separated): ');
      suggestedTags = customTags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      approve = true;
    } else {
      approve = answer.toLowerCase() !== 'n';
    }
  }

  if (!approve) {
    console.log('   ⏭️  Skipped');
    return { skipped: true };
  }

  const finalTags = await updateDbTags(clients.ddb, photo.id, suggestedTags, photo.tags);
  console.log(`   ✅ Updated DynamoDB tags: ${finalTags.join(', ')}`);
  return { updated: true, tags: finalTags };
}

/** Legacy markdown folder path (pre-cutover). */
async function processMarkdownFolder(postFolder, options, clients) {
  const postDir = path.join(POSTS_DIR, postFolder);
  const mdxPath = path.join(postDir, 'index.md');
  if (!fs.existsSync(mdxPath)) {
    console.error(`   ❌ No index.md in ${postFolder}`);
    return { error: true };
  }
  const { data } = matter(fs.readFileSync(mdxPath, 'utf8'));
  if (data.type !== 'photo') {
    console.log('   ⏭️  Not a photo post');
    return { skipped: true };
  }
  if (data.id != null) {
    const photo = await getPhoto(clients.ddb, data.id);
    if (photo) return processDbPhoto(photo, options, clients);
  }
  // Fallback: local file + write markdown only
  const files = fs.readdirSync(postDir);
  const photoFile = files.find((f) => ['.jpg', '.jpeg', '.png'].includes(path.extname(f).toLowerCase()));
  if (!photoFile) {
    console.log('   ⚠️  No photo file found');
    return { skipped: true };
  }
  console.log(`\n📸 Processing markdown folder: ${postFolder}`);
  const suggestedTags = await analyzeBuffer(
    clients.bedrock,
    fs.readFileSync(path.join(postDir, photoFile)),
  );
  console.log(`   ✨ Suggested tags: ${suggestedTags.join(', ')}`);
  if (options.dryRun) return { dryRun: true };
  let approve = options.autoApprove;
  if (!approve) {
    const answer = await prompt('   Apply these tags to markdown? (Y/n): ');
    approve = answer.toLowerCase() !== 'n';
  }
  if (!approve) return { skipped: true };
  const existing = data.tags || [];
  data.tags = [...new Set([...existing, ...suggestedTags])];
  const { content } = matter(fs.readFileSync(mdxPath, 'utf8'));
  fs.writeFileSync(mdxPath, matter.stringify(content, data));
  console.log(`   ✅ Updated markdown tags: ${data.tags.join(', ')}`);
  return { updated: true };
}

async function main() {
  console.log('📸 AI Photo Tagging (DynamoDB)\n');
  const options = parseArgs();
  const clients = awsClients(options.profile);
  if (options.profile) console.log(`🔑 AWS profile: ${options.profile}\n`);

  const results = { updated: 0, skipped: 0, errors: 0, dryRun: 0 };

  try {
    if (options.all) {
      const photos = await listAllPhotos(clients.ddb);
      console.log(`📊 Found ${photos.length} photo(s) in DynamoDB\n`);
      for (const photo of photos) {
        const result = await processDbPhoto(photo, options, clients);
        if (result.updated) results.updated++;
        if (result.skipped) results.skipped++;
        if (result.error) results.errors++;
        if (result.dryRun) results.dryRun++;
      }
    } else if (options.target && /^\d+$/.test(options.target)) {
      const photo = await getPhoto(clients.ddb, options.target);
      if (!photo) {
        console.error(`❌ Photo id ${options.target} not found in ${TABLE}\n`);
        process.exit(1);
      }
      const result = await processDbPhoto(photo, options, clients);
      if (result.updated) results.updated++;
      if (result.skipped) results.skipped++;
      if (result.error) results.errors++;
      if (result.dryRun) results.dryRun++;
    } else if (options.target) {
      const result = await processMarkdownFolder(options.target, options, clients);
      if (result.updated) results.updated++;
      if (result.skipped) results.skipped++;
      if (result.error) results.errors++;
      if (result.dryRun) results.dryRun++;
    } else {
      console.error('❌ Must specify photo id, folder, or --all\n');
      showHelp();
      process.exit(1);
    }
  } finally {
    rl.close();
  }

  console.log('\n' + '─'.repeat(50));
  console.log('\n📊 Tagging Summary:');
  console.log(`   ✅ Updated: ${results.updated}`);
  if (results.skipped) console.log(`   ⏭️  Skipped: ${results.skipped}`);
  if (results.errors) console.log(`   ❌ Errors: ${results.errors}`);
  if (results.dryRun) console.log(`   🔍 Dry run: ${results.dryRun}`);
  if (options.dryRun) {
    console.log('\n💡 Dry run only — remove --dry-run to apply.');
  } else if (results.updated > 0) {
    console.log('\n💡 Tags written to DynamoDB; site reads live via the photo API.');
  }
  console.log('');
  if (results.errors) process.exit(1);
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  try {
    rl.close();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
