#!/usr/bin/env node

/**
 * WordPress to Next.js Migration Script
 * Migrates posts from WordPress REST API to MDX files
 */

const fs = require('fs');
const path = require('path');
const cliProgress = require('cli-progress');

const WordPressAPI = require('./lib/wp-api');
const HTMLToMDXConverter = require('./lib/html-to-mdx');
const ImageDownloader = require('./lib/image-downloader');
const PostWriter = require('./lib/post-writer');

// CLI Arguments
const args = process.argv.slice(2);
const flags = {
  dryRun: args.includes('--dry-run'),
  resume: args.includes('--resume'),
  skipImages: args.includes('--skip-images'),
  limit: parseInt(args.find(arg => arg.startsWith('--limit='))?.split('=')[1]) || null,
  phase: args.find(arg => arg.startsWith('--phase='))?.split('=')[1] || null,
};

// State file
const STATE_FILE = path.join(__dirname, 'migration-state.json');

// Migration statistics
const stats = {
  total: 0,
  processed: 0,
  succeeded: 0,
  failed: 0,
  imagesDownloaded: 0,
  imagesFailed: 0,
  categories: {},
  errors: []
};

/**
 * Main migration orchestrator
 */
async function migrate() {
  console.log('\n=================================');
  console.log('WordPress to Next.js Migration');
  console.log('=================================\n');

  if (flags.dryRun) {
    console.log('🔍 DRY RUN MODE - No files will be written\n');
  }

  let state = loadState();

  try {
    // Phase 1: Fetch metadata
    if (!state.phases?.fetch || flags.phase === 'fetch') {
      state = await fetchMetadata(state);
      saveState(state);
    } else {
      console.log('✓ Phase 1: Fetch metadata (already completed)\n');
    }

    // Phase 2: Process content
    if (!state.phases?.process || flags.phase === 'process') {
      state = await processContent(state);
      saveState(state);
    } else {
      console.log('✓ Phase 2: Process content (already completed)\n');
    }

    // Phase 3: Download images
    if (!flags.skipImages && (!state.phases?.images || flags.phase === 'images')) {
      state = await downloadImages(state);
      saveState(state);
    } else if (flags.skipImages) {
      console.log('⊘ Phase 3: Download images (skipped)\n');
      state.phases.images = true;
    } else {
      console.log('✓ Phase 3: Download images (already completed)\n');
    }

    // Phase 4: Write posts
    if (!flags.dryRun && (!state.phases?.write || flags.phase === 'write')) {
      state = await writePosts(state);
      saveState(state);
    } else if (flags.dryRun) {
      console.log('⊘ Phase 4: Write posts (skipped in dry run)\n');
    } else {
      console.log('✓ Phase 4: Write posts (already completed)\n');
    }

    // Print final report
    printReport(state);

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    saveState(state);
    process.exit(1);
  }
}

/**
 * Phase 1: Fetch metadata from WordPress
 */
async function fetchMetadata(state) {
  console.log('Phase 1: Fetching metadata from WordPress\n');

  const api = new WordPressAPI();

  // Fetch posts
  const posts = await api.fetchAllPosts();

  // Apply limit if specified
  const limitedPosts = flags.limit ? posts.slice(0, flags.limit) : posts;

  console.log(`  Posts to migrate: ${limitedPosts.length}${flags.limit ? ` (limited from ${posts.length})` : ''}\n`);

  // Fetch categories and tags
  const categories = await api.fetchCategories();
  const tags = await api.fetchTags();

  state.rawPosts = limitedPosts;
  state.categories = categories;
  state.tags = tags;
  state.phases = state.phases || {};
  state.phases.fetch = true;

  stats.total = limitedPosts.length;

  console.log('✓ Phase 1 complete\n');
  return state;
}

/**
 * Phase 2: Process content (HTML to MDX)
 */
async function processContent(state) {
  console.log('Phase 2: Processing content\n');

  const converter = new HTMLToMDXConverter();
  const api = new WordPressAPI();
  const writer = new PostWriter();

  const processedPosts = [];
  const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  bar.start(state.rawPosts.length, 0);

  for (let i = 0; i < state.rawPosts.length; i++) {
    const post = state.rawPosts[i];

    try {
      // Extract data
      const title = post.title?.rendered || 'Untitled';
      const wpSlug = post.slug;
      const content = post.content?.rendered || '';
      const wpDate = post.date;
      const excerpt = post.excerpt?.rendered
        ? converter.generateExcerpt(post.excerpt.rendered)
        : converter.generateExcerpt(content);

      // Convert HTML to MDX
      const mdxContent = converter.convert(content);

      // Extract image URLs
      const imageUrls = converter.extractImageUrls(content);
      const featuredImageUrl = api.getFeaturedImageUrl(post);

      // Get categories and tags
      const wpCategories = api.getPostCategories(post, state.categories);
      const wpTags = api.getPostTags(post, state.tags);

      // Map category
      const category = writer.mapCategory(wpCategories);

      // Parse date
      const publishedAt = writer.parseDate(wpDate);

      // Generate slug
      const slug = writer.generateSlug(wpSlug);

      // Prepare processed post
      const processedPost = {
        wpId: post.id,
        wpUrl: post.link,
        slug,
        date: publishedAt,
        title,
        content: mdxContent,
        excerpt,
        category,
        tags: wpTags,
        wpCategories,
        featuredImageUrl,
        imageUrls: imageUrls.filter(url => url.includes('/wp-content/uploads/')),
        frontmatter: {
          title,
          publishedAt,
          excerpt,
          category,
          tags: wpTags,
          draft: true, // All posts start as drafts
          wpId: post.id,
          wpUrl: post.link
        }
      };

      processedPosts.push(processedPost);

      // Track category stats
      stats.categories[category] = (stats.categories[category] || 0) + 1;

    } catch (error) {
      stats.errors.push({
        phase: 'process',
        postId: post.id,
        postTitle: post.title?.rendered,
        error: error.message
      });
    }

    bar.update(i + 1);
  }

  bar.stop();

  state.processedPosts = processedPosts;
  state.phases.process = true;
  stats.processed = processedPosts.length;

  console.log(`✓ Processed ${processedPosts.length} posts\n`);
  return state;
}

/**
 * Phase 3: Download images
 */
async function downloadImages(state) {
  console.log('Phase 3: Downloading images\n');

  const downloader = new ImageDownloader();
  const writer = new PostWriter();

  // Collect all images to download
  const imagesToDownload = [];

  for (const post of state.processedPosts) {
    const postDir = writer.getPostDirectory(post.slug, post.date);

    // Featured image
    if (post.featuredImageUrl) {
      const filename = downloader.getLocalFilename(post.featuredImageUrl);
      const ext = path.extname(filename);
      const coverFilename = `cover${ext}`;

      imagesToDownload.push({
        url: post.featuredImageUrl,
        destPath: path.join(postDir, coverFilename),
        postSlug: post.slug,
        type: 'cover'
      });

      post.coverImageLocal = `./${coverFilename}`;
      post.frontmatter.coverImage = `./${coverFilename}`;
    }

    // Content images
    if (post.imageUrls && post.imageUrls.length > 0) {
      post.imageUrlMap = {};

      post.imageUrls.forEach(url => {
        const filename = downloader.getLocalFilename(url);

        imagesToDownload.push({
          url,
          destPath: path.join(postDir, filename),
          postSlug: post.slug,
          type: 'content'
        });

        post.imageUrlMap[url] = filename;
      });
    }
  }

  console.log(`  Total images to download: ${imagesToDownload.length}\n`);

  if (imagesToDownload.length === 0) {
    console.log('✓ No images to download\n');
    state.phases.images = true;
    return state;
  }

  // Download images with progress
  const bar = new cliProgress.SingleBar({
    format: '  Progress |{bar}| {percentage}% | {value}/{total} images | {status}'
  }, cliProgress.Presets.shades_classic);

  bar.start(imagesToDownload.length, 0, { status: 'Starting...' });

  const results = await downloader.downloadImages(imagesToDownload, (progress) => {
    bar.update(progress.index, {
      status: progress.status === 'success' ? 'OK' : `Failed: ${progress.error}`
    });
  });

  bar.stop();

  stats.imagesDownloaded = results.succeeded;
  stats.imagesFailed = results.failed;

  if (results.failed > 0) {
    console.log(`\n⚠️  ${results.failed} images failed to download:`);
    results.failures.forEach(f => {
      console.log(`    - ${f.url}`);
      console.log(`      Error: ${f.error}`);
    });
    console.log();
  }

  // Update MDX content with local image paths
  for (const post of state.processedPosts) {
    if (post.imageUrlMap) {
      const converter = new HTMLToMDXConverter();
      post.content = converter.replaceImageUrls(post.content, post.imageUrlMap);
    }
  }

  state.phases.images = true;
  console.log(`✓ Downloaded ${results.succeeded}/${results.total} images\n`);

  return state;
}

/**
 * Phase 4: Write posts to disk
 */
async function writePosts(state) {
  console.log('Phase 4: Writing posts to disk\n');

  const writer = new PostWriter();
  const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

  bar.start(state.processedPosts.length, 0);

  for (let i = 0; i < state.processedPosts.length; i++) {
    const post = state.processedPosts[i];

    try {
      // Check for slug conflicts
      post.slug = writer.resolveSlugConflict(post.slug, post.date);

      // Write post
      const result = writer.writePost({
        slug: post.slug,
        date: post.date,
        frontmatter: post.frontmatter,
        content: post.content
      });

      if (result.success) {
        post.written = true;
        post.writtenPath = result.path;
        stats.succeeded++;
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      stats.failed++;
      stats.errors.push({
        phase: 'write',
        postSlug: post.slug,
        postTitle: post.title,
        error: error.message
      });
    }

    bar.update(i + 1);
  }

  bar.stop();

  state.phases.write = true;
  console.log(`✓ Wrote ${stats.succeeded} posts\n`);

  return state;
}

/**
 * Print final migration report
 */
function printReport(state) {
  console.log('\n=================================');
  console.log('Migration Report');
  console.log('=================================\n');

  console.log(`Total posts: ${stats.total}`);
  console.log(`Processed: ${stats.processed}`);

  if (!flags.dryRun) {
    console.log(`Successfully migrated: ${stats.succeeded}`);
    console.log(`Failed: ${stats.failed}`);
  }

  if (!flags.skipImages) {
    console.log(`\nImages:`);
    console.log(`  Downloaded: ${stats.imagesDownloaded}`);
    console.log(`  Failed: ${stats.imagesFailed}`);
  }

  console.log(`\nCategories:`);
  Object.entries(stats.categories)
    .sort(([,a], [,b]) => b - a)
    .forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count} posts`);
    });

  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Errors (${stats.errors.length}):`);
    stats.errors.forEach(err => {
      console.log(`  - ${err.postTitle || err.postSlug} (${err.phase})`);
      console.log(`    ${err.error}`);
    });
  }

  if (!flags.dryRun && stats.succeeded > 0) {
    console.log('\n=================================');
    console.log('Next Steps');
    console.log('=================================\n');
    console.log('1. Review migrated posts:');
    console.log('   npm run dev\n');
    console.log('2. Optimize images:');
    console.log('   blog images:optimize\n');
    console.log('3. Upload to S3:');
    console.log('   blog images:sync --profile www\n');
    console.log('4. Publish posts by setting draft: false\n');
  }
}

/**
 * Load migration state from disk
 */
function loadState() {
  if (!flags.resume || !fs.existsSync(STATE_FILE)) {
    return {
      phases: {},
      rawPosts: [],
      processedPosts: [],
      categories: {},
      tags: {}
    };
  }

  console.log('📂 Resuming from previous state\n');
  return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
}

/**
 * Save migration state to disk
 */
function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

// Run migration
migrate().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
