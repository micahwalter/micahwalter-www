/**
 * Backfill Post IDs
 *
 * Assigns a sequential `id` to every post that doesn't already have one.
 * Posts are processed in ascending publishedAt order so that older posts
 * receive lower IDs.  The shared content/post-counter file is updated to
 * reflect the new high-water mark.
 *
 * Usage:
 *   node scripts/backfill-ids.js           # write changes
 *   node scripts/backfill-ids.js --dry-run # preview only
 */

'use strict';

const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(process.cwd(), 'content/posts');
const COUNTER_FILE = path.join(process.cwd(), 'content/post-counter');

const dryRun = process.argv.includes('--dry-run');

// ---------------------------------------------------------------------------
// Counter helpers
// ---------------------------------------------------------------------------

function readCounter() {
  if (!fs.existsSync(COUNTER_FILE)) return 0;
  return parseInt(fs.readFileSync(COUNTER_FILE, 'utf8').trim(), 10) || 0;
}

function writeCounter(value) {
  fs.writeFileSync(COUNTER_FILE, String(value));
}

// ---------------------------------------------------------------------------
// Frontmatter helpers
// ---------------------------------------------------------------------------

/**
 * Return true if the frontmatter block already contains an `id:` key.
 */
function hasId(source) {
  // Match the YAML block between the first two `---` lines
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return false;
  return /^id\s*:/m.test(match[1]);
}

/**
 * Insert `id: N` as the first key after the opening `---`.
 * Returns the modified source string.
 */
function insertId(source, id) {
  // Replace the opening `---\n` (or `---\r\n`) with `---\nid: N\n`
  return source.replace(/^(---\r?\n)/, `$1id: ${id}\n`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

// Gather all posts that need a backfilled id
const folders = fs
  .readdirSync(POSTS_DIR)
  .filter((f) => fs.statSync(path.join(POSTS_DIR, f)).isDirectory());

const pending = [];

for (const folder of folders) {
  const mdxPath = path.join(POSTS_DIR, folder, 'index.md');
  if (!fs.existsSync(mdxPath)) continue;

  const source = fs.readFileSync(mdxPath, 'utf8');
  if (hasId(source)) continue;

  // Extract publishedAt for sorting
  const dateMatch = source.match(/publishedAt\s*:\s*['"]?(\d{4}-\d{2}-\d{2})['"]?/);
  const publishedAt = dateMatch ? dateMatch[1] : '0000-00-00';

  pending.push({ folder, mdxPath, source, publishedAt });
}

if (pending.length === 0) {
  console.log('✅ All posts already have an id — nothing to do.');
  process.exit(0);
}

// Sort oldest → newest so IDs are assigned chronologically
pending.sort((a, b) => {
  if (a.publishedAt < b.publishedAt) return -1;
  if (a.publishedAt > b.publishedAt) return 1;
  // Secondary sort by folder name for posts on the same day
  return a.folder.localeCompare(b.folder);
});

const startId = readCounter();
let nextId = startId;

console.log(`${dryRun ? '[DRY RUN] ' : ''}Backfilling ${pending.length} post(s) starting from id ${startId + 1}:\n`);

for (const { folder, mdxPath, source, publishedAt } of pending) {
  nextId++;
  console.log(`  ${dryRun ? '(would write) ' : ''}${folder}  →  id: ${nextId}  (${publishedAt})`);
  if (!dryRun) {
    const updated = insertId(source, nextId);
    fs.writeFileSync(mdxPath, updated);
  }
}

if (!dryRun) {
  writeCounter(nextId);
  console.log(`\n✅ Done. Assigned ids ${startId + 1}–${nextId}. Counter updated to ${nextId}.`);
} else {
  console.log(`\n[DRY RUN] Would assign ids ${startId + 1}–${nextId} and set counter to ${nextId}.`);
  console.log('Run without --dry-run to apply changes.');
}
