/**
 * Backfill Post IDs
 *
 * Assigns a sequential `id` to every post that doesn't already have one.
 * Posts are processed in ascending publishedAt order so that older posts
 * receive lower IDs.
 *
 * After backfill, run `node scripts/seed-post-counter.js --apply` to sync
 * the ticket server DynamoDB counter.
 *
 * Usage:
 *   node scripts/backfill-ids.js           # write changes
 *   node scripts/backfill-ids.js --dry-run # preview only
 */

'use strict';

const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(process.cwd(), 'content/posts');

const dryRun = process.argv.includes('--dry-run');

function hasId(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return false;
  return /^id\s*:/m.test(match[1]);
}

function insertId(source, id) {
  return source.replace(/^(---\r?\n)/, `$1id: ${id}\n`);
}

function maxExistingId() {
  let max = 0;
  if (!fs.existsSync(POSTS_DIR)) return 0;
  for (const folder of fs.readdirSync(POSTS_DIR)) {
    const mdxPath = path.join(POSTS_DIR, folder, 'index.md');
    if (!fs.existsSync(mdxPath)) continue;
    const source = fs.readFileSync(mdxPath, 'utf8');
    const match = source.match(/^id\s*:\s*(\d+)\s*$/m);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > max) max = n;
    }
  }
  return max;
}

const folders = fs
  .readdirSync(POSTS_DIR)
  .filter((f) => fs.statSync(path.join(POSTS_DIR, f)).isDirectory());

const pending = [];

for (const folder of folders) {
  const mdxPath = path.join(POSTS_DIR, folder, 'index.md');
  if (!fs.existsSync(mdxPath)) continue;

  const source = fs.readFileSync(mdxPath, 'utf8');
  if (hasId(source)) continue;

  const dateMatch = source.match(/publishedAt\s*:\s*['"]?(\d{4}-\d{2}-\d{2})['"]?/);
  const publishedAt = dateMatch ? dateMatch[1] : '0000-00-00';

  pending.push({ folder, mdxPath, source, publishedAt });
}

if (pending.length === 0) {
  console.log('✅ All posts already have an id — nothing to do.');
  process.exit(0);
}

pending.sort((a, b) => {
  if (a.publishedAt < b.publishedAt) return -1;
  if (a.publishedAt > b.publishedAt) return 1;
  return a.folder.localeCompare(b.folder);
});

const startId = maxExistingId();
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
  console.log(`\n✅ Done. Assigned ids ${startId + 1}–${nextId}.`);
  console.log(`\n💡 Run: node scripts/seed-post-counter.js --apply  (sync ticket server counter)`);
} else {
  console.log(`\n[DRY RUN] Would assign ids ${startId + 1}–${nextId}.`);
  console.log('Run without --dry-run to apply changes.');
}
