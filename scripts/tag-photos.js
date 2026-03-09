/**
 * AI Photo Tagging with Claude Vision
 *
 * Analyzes photos using Claude's vision API and suggests relevant tags
 * based on image content, composition, mood, and subject matter.
 *
 * Usage:
 *   node scripts/tag-photos.js <post-folder>
 *   node scripts/tag-photos.js --all
 *   node scripts/tag-photos.js --all --auto-approve
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { BedrockRuntimeClient, ConverseCommand } = require('@aws-sdk/client-bedrock-runtime');
const { fromIni } = require('@aws-sdk/credential-providers');
const matter = require('gray-matter');

const POSTS_DIR = path.join(process.cwd(), 'content/posts');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Prompt user for input
 */
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  const profileIndex = args.indexOf('--profile');
  const profile = profileIndex !== -1 && args[profileIndex + 1] ? args[profileIndex + 1] : process.env.AWS_PROFILE;
  const profileValue = profileIndex !== -1 ? args[profileIndex + 1] : null;
  const postFolder = args.find(arg => !arg.startsWith('--') && arg !== profileValue) || null;

  return {
    postFolder,
    all: args.includes('--all'),
    autoApprove: args.includes('--auto-approve'),
    dryRun: args.includes('--dry-run'),
    untaggedOnly: args.includes('--untagged-only'),
    profile,
  };
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
📸 AI Photo Tagging with Claude Vision (via AWS Bedrock)

Usage:
  blog photos:tag <post-folder>
  blog photos:tag --all [options]

Arguments:
  <post-folder>     Specific post folder to tag (e.g., 2026-02-16-sunset)
  --all            Process all photo posts

Options:
  --profile <name> AWS profile to use (default: AWS_PROFILE env var or "www")
  --auto-approve   Automatically apply suggested tags without confirmation
  --untagged-only  Only process photos with minimal tags (just "photography")
  --dry-run        Show suggestions without updating files

Examples:
  blog photos:tag 2026-02-16-sunset-park --profile www
  blog photos:tag --all --profile www
  blog photos:tag --all --auto-approve --profile www

Requirements:
  - AWS credentials configured for the specified profile
  - Bedrock model access enabled in your AWS account (us-east-1)

Notes:
  - Analyzes photo content, composition, mood, and subject matter
  - Suggests 3-8 relevant tags per photo
  - Interactive approval unless --auto-approve is used
  - Existing tags are preserved and merged with suggestions
`);
}

/**
 * Get all photo post directories
 */
function getPhotoPosts() {
  if (!fs.existsSync(POSTS_DIR)) {
    return [];
  }

  const postFolders = fs.readdirSync(POSTS_DIR);

  return postFolders.filter(folder => {
    const fullPath = path.join(POSTS_DIR, folder);
    if (!fs.statSync(fullPath).isDirectory()) return false;

    const mdxPath = path.join(fullPath, 'index.mdx');
    if (!fs.existsSync(mdxPath)) return false;

    // Check if it's a photo post
    const fileContents = fs.readFileSync(mdxPath, 'utf8');
    const { data } = matter(fileContents);
    return data.type === 'photo';
  });
}

/**
 * Find photo file in post directory
 */
function findPhotoFile(postDir) {
  const files = fs.readdirSync(postDir);
  const photoExtensions = ['.jpg', '.jpeg', '.png'];

  const photoFile = files.find(file => {
    const ext = path.extname(file).toLowerCase();
    return photoExtensions.includes(ext);
  });

  return photoFile ? path.join(postDir, photoFile) : null;
}

/**
 * Analyze photo with Claude Vision via AWS Bedrock
 */
async function analyzePhoto(photoPath, profile) {
  const sharp = require('sharp');

  // Read image and resize if needed (Bedrock has a 5MB limit)
  // Resize to max 1600px on longest side, quality 85
  const image = sharp(photoPath);
  const metadata = await image.metadata();

  let imageBuffer;
  const maxDimension = 1600;
  const shouldResize = metadata.width > maxDimension || metadata.height > maxDimension;

  if (shouldResize) {
    console.log(`   📐 Resizing image (${metadata.width}x${metadata.height} → max ${maxDimension}px)`);
    imageBuffer = await image
      .resize(maxDimension, maxDimension, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85 })
      .toBuffer();
  } else {
    imageBuffer = fs.readFileSync(photoPath);
  }

  const clientConfig = { region: 'us-east-1' };
  if (profile) {
    clientConfig.credentials = fromIni({ profile });
  }
  const client = new BedrockRuntimeClient(clientConfig);

  console.log('   🤖 Analyzing with Claude Vision via Bedrock...');

  const command = new ConverseCommand({
    modelId: 'us.anthropic.claude-sonnet-4-6',
    messages: [
      {
        role: 'user',
        content: [
          {
            image: {
              format: 'jpeg',
              source: {
                bytes: imageBuffer,
              },
            },
          },
          {
            text: `Analyze this photo and suggest 3-8 relevant tags that describe:
- Main subject matter (people, objects, animals, architecture, etc.)
- Location type (urban, nature, indoor, outdoor, beach, mountain, etc.)
- Mood/atmosphere (serene, dramatic, vibrant, peaceful, energetic, etc.)
- Visual style (minimalist, colorful, black-and-white, vintage, etc.)
- Notable features (sunset, reflection, pattern, texture, bokeh, etc.)

Provide ONLY the tags as a comma-separated list, lowercase, using hyphens for multi-word tags.
Example format: street-photography, urban, night, city-lights, noir

Tags:`,
          },
        ],
      },
    ],
    inferenceConfig: {
      maxTokens: 1024,
    },
  });

  const response = await client.send(command);
  const responseText = response.output.message.content[0].text.trim();

  // Parse tags from response
  const tags = responseText
    .split(',')
    .map(tag => tag.trim().toLowerCase())
    .filter(tag => tag.length > 0 && tag.length < 30); // Sanity check

  return tags;
}

/**
 * Update frontmatter with new tags
 */
function updatePostTags(postDir, newTags) {
  const mdxPath = path.join(postDir, 'index.mdx');
  const fileContents = fs.readFileSync(mdxPath, 'utf8');
  const { data, content } = matter(fileContents);

  // Merge existing tags with new tags (remove duplicates)
  const existingTags = data.tags || [];
  const mergedTags = [...new Set([...existingTags, ...newTags])];

  data.tags = mergedTags;

  // Rebuild frontmatter
  const updatedContent = matter.stringify(content, data);
  fs.writeFileSync(mdxPath, updatedContent);

  return mergedTags;
}

/**
 * Process a single photo post
 */
async function processPhotoPost(postFolder, options, profile) {
  const postDir = path.join(POSTS_DIR, postFolder);
  const mdxPath = path.join(postDir, 'index.mdx');

  console.log(`\n📸 Processing: ${postFolder}`);

  // Read current frontmatter
  const fileContents = fs.readFileSync(mdxPath, 'utf8');
  const { data } = matter(fileContents);

  // Check if photo is already tagged (for --untagged-only mode)
  const isUntagged = !data.tags || data.tags.length === 0 ||
    (data.tags.length === 1 && data.tags[0].toLowerCase() === 'photography');

  if (options.untaggedOnly && !isUntagged) {
    console.log(`   ⏭️  Already tagged, skipping`);
    return { skipped: true };
  }

  console.log(`   📝 Title: ${data.title}`);
  console.log(`   🏷️  Current tags: ${data.tags ? data.tags.join(', ') : 'none'}`);

  // Find photo file
  const photoPath = findPhotoFile(postDir);
  if (!photoPath) {
    console.log('   ⚠️  No photo file found, skipping');
    return { skipped: true };
  }

  // Analyze with Claude
  let suggestedTags;
  try {
    suggestedTags = await analyzePhoto(photoPath, profile);
  } catch (error) {
    console.error(`   ❌ Error analyzing photo: ${error.message}`);
    return { error: true };
  }

  console.log(`   ✨ Suggested tags: ${suggestedTags.join(', ')}`);

  if (options.dryRun) {
    console.log('   🔍 [DRY RUN] Would add these tags');
    return { dryRun: true };
  }

  // Get approval
  let approve = options.autoApprove;
  if (!approve) {
    const answer = await prompt('   Apply these tags? (Y/n/edit): ');
    if (answer.toLowerCase() === 'edit' || answer.toLowerCase() === 'e') {
      const customTags = await prompt('   Enter tags (comma-separated): ');
      suggestedTags = customTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      approve = true;
    } else {
      approve = answer.toLowerCase() !== 'n';
    }
  }

  if (!approve) {
    console.log('   ⏭️  Skipped');
    return { skipped: true };
  }

  // Update tags
  const finalTags = updatePostTags(postDir, suggestedTags);
  console.log(`   ✅ Updated tags: ${finalTags.join(', ')}`);

  return { updated: true, tags: finalTags };
}

/**
 * Main execution
 */
async function main() {
  console.log('📸 AI Photo Tagging with Claude Vision\n');

  const options = parseArgs();
  const { profile } = options;

  if (profile) {
    console.log(`🔑 Using AWS profile: ${profile}\n`);
  }

  // Determine which posts to process
  let postsToProcess = [];

  if (options.all) {
    postsToProcess = getPhotoPosts();
    if (postsToProcess.length === 0) {
      console.log('⚠️  No photo posts found\n');
      process.exit(0);
    }
    console.log(`📊 Found ${postsToProcess.length} photo post(s)\n`);
  } else if (options.postFolder) {
    const postDir = path.join(POSTS_DIR, options.postFolder);
    if (!fs.existsSync(postDir)) {
      console.error(`❌ Error: Post folder not found: ${options.postFolder}\n`);
      process.exit(1);
    }
    postsToProcess = [options.postFolder];
  } else {
    console.error('❌ Error: Must specify post folder or --all\n');
    showHelp();
    process.exit(1);
  }

  // Process each post
  const results = {
    updated: 0,
    skipped: 0,
    errors: 0,
    dryRun: 0,
  };

  for (const postFolder of postsToProcess) {
    try {
      const result = await processPhotoPost(postFolder, options, profile);
      if (result.updated) results.updated++;
      if (result.skipped) results.skipped++;
      if (result.error) results.errors++;
      if (result.dryRun) results.dryRun++;
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      results.errors++;
    }
  }

  // Summary
  console.log('\n' + '─'.repeat(50));
  console.log('\n📊 Tagging Summary:');
  console.log(`   ✅ Updated: ${results.updated}`);
  if (results.skipped > 0) console.log(`   ⏭️  Skipped: ${results.skipped}`);
  if (results.errors > 0) console.log(`   ❌ Errors: ${results.errors}`);
  if (results.dryRun > 0) console.log(`   🔍 Dry run: ${results.dryRun}`);

  if (options.dryRun) {
    console.log('\n💡 This was a dry run. Remove --dry-run to apply changes.');
  } else if (results.updated > 0) {
    console.log('\n💡 Next steps:');
    console.log('   1. Review the updated tags in your posts');
    console.log('   2. Run: git add content/posts/');
    console.log('   3. Run: git commit -m "Update photo tags with AI suggestions"');
  }

  console.log('');
  rl.close();
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  rl.close();
  process.exit(1);
});
