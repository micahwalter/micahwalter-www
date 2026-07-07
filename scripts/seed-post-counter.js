/**
 * Seed the ticket server DynamoDB counter from local post state.
 *
 * Computes max(content/post-counter, max frontmatter id) and writes to
 * post_tickets in us-east-1. Dry-run by default; use --apply after review.
 *
 * Usage:
 *   node scripts/seed-post-counter.js
 *   node scripts/seed-post-counter.js --apply
 *   node scripts/seed-post-counter.js --apply --profile www
 */

'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const POSTS_DIR = path.join(process.cwd(), 'content/posts');
const COUNTER_FILE = path.join(process.cwd(), 'content/post-counter');
const TABLE_NAME = process.env.TICKETS_TABLE_NAME || 'post_tickets';
const REGION = process.env.TICKETS_DYNAMODB_REGION || 'us-east-1';

const apply = process.argv.includes('--apply');
const profileArg = process.argv.find((a, i) => process.argv[i - 1] === '--profile');
const profile = profileArg || process.env.AWS_PROFILE || 'www';

function maxIdFromPosts() {
  if (!fs.existsSync(POSTS_DIR)) return 0;
  let max = 0;
  for (const folder of fs.readdirSync(POSTS_DIR)) {
    const indexPath = path.join(POSTS_DIR, folder, 'index.md');
    if (!fs.existsSync(indexPath)) continue;
    const source = fs.readFileSync(indexPath, 'utf8');
    const match = source.match(/^id\s*:\s*(\d+)\s*$/m);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > max) max = n;
    }
  }
  return max;
}

function readFileCounter() {
  if (!fs.existsSync(COUNTER_FILE)) return 0;
  return parseInt(fs.readFileSync(COUNTER_FILE, 'utf8').trim(), 10) || 0;
}

function prompt(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const fromPosts = maxIdFromPosts();
  const fromFile = readFileCounter();
  const seedValue = Math.max(fromPosts, fromFile);

  console.log('Ticket server counter seed preview\n');
  console.log(`  Max id in post frontmatter: ${fromPosts}`);
  console.log(`  content/post-counter file:    ${fromFile}${fs.existsSync(COUNTER_FILE) ? '' : ' (missing)'}`);
  console.log(`  Seed value (DynamoDB):        ${seedValue}`);
  console.log(`  Next allocated id will be:    ${seedValue + 1}`);
  console.log(`  Table: ${TABLE_NAME} (${REGION})`);

  if (!apply) {
    console.log('\n[DRY RUN] No changes written. Re-run with --apply to seed DynamoDB.');
    return;
  }

  const confirm = await prompt('\nType YES to write this value to DynamoDB: ');
  if (confirm !== 'YES') {
    console.log('Aborted.');
    process.exit(1);
  }

  const item = JSON.stringify({
    partition: { S: 'post-ids' },
    value: { N: String(seedValue) },
  });

  const cmd = [
    'aws', 'dynamodb', 'put-item',
    '--table-name', TABLE_NAME,
    '--item', item,
    '--region', REGION,
    '--profile', profile,
  ].join(' ');

  console.log(`\nRunning: ${cmd}\n`);
  execSync(cmd, { stdio: 'inherit' });
  console.log(`\n✅ Counter seeded to ${seedValue}. Next POST /tickets/next returns id ${seedValue + 1}.`);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
