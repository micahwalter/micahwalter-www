/**
 * Fix HTML Entities in MDX Files
 *
 * Decodes HTML entities like &#8217; to their proper characters
 */

const fs = require('fs');
const path = require('path');

const postsDir = path.join(process.cwd(), 'content/posts');

// HTML entity map for common WordPress entities
const htmlEntities = {
  '&#8217;': "'",  // right single quotation mark
  '&#8216;': "'",  // left single quotation mark
  '&#8220;': '"',  // left double quotation mark
  '&#8221;': '"',  // right double quotation mark
  '&#8211;': '–',  // en dash
  '&#8212;': '—',  // em dash
  '&#038;': '&',   // ampersand
  '&amp;': '&',    // ampersand
  '&#8230;': '…',  // ellipsis
  '&ldquo;': '"',
  '&rdquo;': '"',
  '&lsquo;': "'",
  '&rsquo;': "'",
  '&mdash;': '—',
  '&ndash;': '–',
  '&hellip;': '…',
};

/**
 * Decode HTML entities in text
 */
function decodeHtmlEntities(text) {
  let result = text;

  // Replace known entities
  for (const [entity, char] of Object.entries(htmlEntities)) {
    result = result.split(entity).join(char);
  }

  // Replace numeric entities (&#NNNN;)
  result = result.replace(/&#(\d+);/g, (match, dec) => {
    return String.fromCharCode(dec);
  });

  // Replace hex entities (&#xHHHH;)
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });

  return result;
}

/**
 * Process a single MDX file
 */
function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const decoded = decodeHtmlEntities(content);

  if (content !== decoded) {
    fs.writeFileSync(filePath, decoded, 'utf8');
    return true;
  }

  return false;
}

/**
 * Main execution
 */
function main() {
  console.log('🔧 Fixing HTML entities in MDX files...\n');

  const postDirs = fs.readdirSync(postsDir).filter(folder => {
    const fullPath = path.join(postsDir, folder);
    return fs.statSync(fullPath).isDirectory();
  });

  let fixedCount = 0;

  for (const postDir of postDirs) {
    const mdxPath = path.join(postsDir, postDir, 'index.mdx');

    if (!fs.existsSync(mdxPath)) {
      continue;
    }

    const wasFixed = processFile(mdxPath);
    if (wasFixed) {
      fixedCount++;
      console.log(`✓ Fixed ${postDir}`);
    }
  }

  console.log(`\n✅ Complete! Fixed ${fixedCount} file${fixedCount !== 1 ? 's' : ''}`);
}

// Run the script
main();
