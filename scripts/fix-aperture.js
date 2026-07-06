/**
 * Fix Aperture Formatting
 *
 * Fixes aperture values that have duplicate f/ prefix (f/f/1.4 → f/1.4)
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const POSTS_DIR = path.join(process.cwd(), 'content/posts');

function getAllPhotoPosts() {
  if (!fs.existsSync(POSTS_DIR)) {
    return [];
  }

  const postFolders = fs.readdirSync(POSTS_DIR);

  return postFolders.filter(folder => {
    const fullPath = path.join(POSTS_DIR, folder);
    if (!fs.statSync(fullPath).isDirectory()) return false;

    const mdxPath = path.join(fullPath, 'index.md');
    if (!fs.existsSync(mdxPath)) return false;

    // Check if it's a photo post
    const fileContents = fs.readFileSync(mdxPath, 'utf8');
    const { data } = matter(fileContents);
    return data.type === 'photo';
  });
}

function fixAperture(postFolder) {
  const mdxPath = path.join(POSTS_DIR, postFolder, 'index.md');
  const fileContents = fs.readFileSync(mdxPath, 'utf8');
  const { data, content } = matter(fileContents);

  // Check if aperture needs fixing
  if (data.aperture && data.aperture.startsWith('f/f/')) {
    const oldValue = data.aperture;
    data.aperture = data.aperture.replace(/^f\/f\//, 'f/');

    console.log(`${postFolder}: ${oldValue} → ${data.aperture}`);

    // Write back
    const updatedContent = matter.stringify(content, data);
    fs.writeFileSync(mdxPath, updatedContent);

    return { fixed: true };
  }

  return { skipped: true };
}

function main() {
  console.log('🔧 Fixing aperture formatting...\n');

  const photoPosts = getAllPhotoPosts();
  console.log(`Found ${photoPosts.length} photo posts\n`);

  let fixed = 0;
  let skipped = 0;

  photoPosts.forEach(folder => {
    const result = fixAperture(folder);
    if (result.fixed) fixed++;
    if (result.skipped) skipped++;
  });

  console.log('\n' + '─'.repeat(50));
  console.log(`\n✅ Fixed: ${fixed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log('');
}

main();
