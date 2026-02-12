/**
 * Create New Blog Post
 *
 * Creates a new blog post with proper directory structure and frontmatter template.
 * Prompts for title and optional metadata.
 *
 * Usage:
 *   node scripts/create-post.js
 *   node scripts/create-post.js "My Post Title"
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const POSTS_DIR = path.join(process.cwd(), 'content/posts');

/**
 * Create readline interface for user input
 */
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
 * Generate slug from title
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generate frontmatter template
 */
function generateFrontmatter(data) {
  const { title, date, excerpt, category, tags, coverImage, draft } = data;

  return `---
title: "${title}"
publishedAt: "${date}"
excerpt: "${excerpt}"
category: "${category}"
tags: [${tags.map(t => `"${t}"`).join(', ')}]
coverImage: "${coverImage}"
draft: ${draft}
---

Write your post content here...

## First Section

Your content goes here.

## Second Section

More content...
`;
}

/**
 * Create post directory and files
 */
function createPost(postData) {
  const { title, date, slug } = postData;
  const dirName = `${date}-${slug}`;
  const postDir = path.join(POSTS_DIR, dirName);

  // Check if directory already exists
  if (fs.existsSync(postDir)) {
    console.error(`\n❌ Post directory already exists: ${dirName}`);
    console.error('   Choose a different title or delete the existing directory.');
    return false;
  }

  // Create directory
  fs.mkdirSync(postDir, { recursive: true });

  // Create index.mdx with frontmatter
  const indexPath = path.join(postDir, 'index.mdx');
  const content = generateFrontmatter(postData);
  fs.writeFileSync(indexPath, content);

  return { dirName, postDir, indexPath };
}

/**
 * Main execution
 */
async function main() {
  console.log('📝 Create New Blog Post\n');

  // Get title from command line or prompt
  let title = process.argv[2];
  if (!title) {
    title = await prompt('Post title: ');
  }

  if (!title) {
    console.error('❌ Title is required');
    rl.close();
    process.exit(1);
  }

  // Generate slug and date
  const slug = generateSlug(title);
  const date = getTodayDate();
  const dirName = `${date}-${slug}`;

  console.log(`\n📅 Date: ${date}`);
  console.log(`🔗 Slug: ${slug}`);
  console.log(`📁 Directory: ${dirName}\n`);

  // Get optional metadata
  const excerpt = await prompt('Excerpt (press Enter to skip): ');

  console.log('\nCategories: AI, AWS, Writing, or enter custom');
  const category = await prompt('Category (default: Writing): ') || 'Writing';

  const tagsInput = await prompt('Tags (comma-separated, press Enter to skip): ');
  const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()) : [category];

  const coverImage = await prompt('Cover image filename (default: ./cover.jpg): ') || './cover.jpg';

  const draftInput = await prompt('Draft? (Y/n, default: Y): ');
  const draft = draftInput.toLowerCase() === 'n' ? false : true;

  rl.close();

  // Create post
  const postData = {
    title,
    date,
    slug,
    excerpt: excerpt || `A new post about ${title.toLowerCase()}`,
    category,
    tags,
    coverImage,
    draft
  };

  console.log('\n📦 Creating post...');

  const result = createPost(postData);

  if (!result) {
    process.exit(1);
  }

  const { dirName: createdDir, postDir, indexPath } = result;

  console.log('\n✅ Post created successfully!\n');
  console.log('📁 Location:');
  console.log(`   ${postDir}\n`);
  console.log('📝 Files:');
  console.log(`   ${path.relative(process.cwd(), indexPath)}\n`);
  console.log('💡 Next steps:');
  console.log(`   1. Edit the post: ${path.relative(process.cwd(), indexPath)}`);
  if (coverImage !== 'none') {
    console.log(`   2. Add cover image: ${path.join(createdDir, coverImage.replace('./', ''))}`);
  }
  console.log(`   3. When ready to publish, set draft: false`);
  console.log(`   4. Run: blog images:optimize (if you added images)`);
  console.log('');
}

main().catch(err => {
  console.error('❌ Error creating post:', err);
  process.exit(1);
});
