#!/usr/bin/env node
/**
 * blog email:send <slug>
 *
 * Validates an email post, renders its MDX to HTML and plain text,
 * then emits a NewsletterSendRequested event onto newsletter-bus.
 *
 * The Lambda newsletter-dispatch-fn handles subscriber querying,
 * token generation, and SES delivery — this script is intentionally thin.
 *
 * Usage:
 *   blog email:send march-2026
 *   blog email:send march-2026 --profile www
 *   blog email:send march-2026 --dry-run
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const matter = require('gray-matter');

const POSTS_DIR = path.join(process.cwd(), 'content/posts');
const EVENT_BUS_NAME = 'newsletter-bus';
const SITE_URL = 'https://www.micahwalter.com';

// ---------------------------------------------------------------------------
// CLI arg parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const slug = args.find(a => !a.startsWith('--'));
const isDryRun = args.includes('--dry-run');
const profileIndex = args.indexOf('--profile');
const awsProfile = profileIndex !== -1 ? args[profileIndex + 1] : undefined;

if (!slug) {
  console.error('Usage: blog email:send <slug> [--dry-run] [--profile <name>]');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Locate post folder
// ---------------------------------------------------------------------------

function findPostFolder(targetSlug) {
  if (!fs.existsSync(POSTS_DIR)) {
    return null;
  }
  const folders = fs.readdirSync(POSTS_DIR).filter(f =>
    fs.statSync(path.join(POSTS_DIR, f)).isDirectory()
  );
  return folders.find(f => {
    const folderSlug = f.replace(/^\d{4}-\d{2}-\d{2}-/, '');
    return folderSlug === targetSlug;
  }) || null;
}

// ---------------------------------------------------------------------------
// MDX → HTML via next-mdx-remote (compile only — no React rendering)
// We use a lightweight approach: strip MDX/markdown to HTML with remark/rehype.
// ---------------------------------------------------------------------------

async function renderMDX(mdxContent, folderName) {
  // Dynamic imports — these are ESM modules
  const { unified } = await import('unified');
  const { default: remarkParse } = await import('remark-parse');
  const { default: remarkGfm } = await import('remark-gfm');
  const { default: remarkRehype } = await import('remark-rehype');
  const { default: rehypeStringify } = await import('rehype-stringify');
  const TurndownService = require('turndown');

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(mdxContent);

  const htmlBody = String(file);

  // Plain text via turndown
  const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
  const textBody = td.turndown(htmlBody);

  return { htmlBody, textBody };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validate(data, slug) {
  if (data.type !== 'email') {
    throw new Error(`not an email post (type: "${data.type || 'blog'}")`);
  }
  if (data.draft) {
    throw new Error('cannot send a draft');
  }
  if (!data.id) {
    throw new Error('email id is required for send tracking');
  }
  if (!data.publishedAt) {
    throw new Error('publishedAt is required');
  }
  const pub = new Date(data.publishedAt);
  if (isNaN(pub.getTime())) {
    throw new Error(`publishedAt is not a valid date: "${data.publishedAt}"`);
  }
  if (pub > new Date()) {
    throw new Error(`publishedAt is in the future — update the date or wait`);
  }
}

// ---------------------------------------------------------------------------
// EventBridge emit via AWS CLI
// ---------------------------------------------------------------------------

function emitEvent(payload) {
  const detail = JSON.stringify(payload);
  const entry = JSON.stringify([{
    EventBusName: EVENT_BUS_NAME,
    Source: 'newsletter.campaigns',
    DetailType: 'NewsletterSendRequested',
    Detail: detail,
  }]);

  const profileFlag = awsProfile ? `--profile ${awsProfile}` : '';
  const cmd = `aws events put-events --entries '${entry.replace(/'/g, "'\\''")}' ${profileFlag}`;

  if (isDryRun) {
    console.log('\n[dry-run] Would emit event:');
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const result = execSync(cmd, { encoding: 'utf8' });
  const parsed = JSON.parse(result);
  if (parsed.FailedEntryCount > 0) {
    throw new Error(`EventBridge put-events failed: ${JSON.stringify(parsed.Entries[0])}`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // 1. Find folder
  const folder = findPostFolder(slug);
  if (!folder) {
    console.error(`Error: no post folder found for slug "${slug}"`);
    process.exit(1);
  }

  const mdxPath = path.join(POSTS_DIR, folder, 'index.mdx');
  if (!fs.existsSync(mdxPath)) {
    console.error(`Error: ${mdxPath} does not exist`);
    process.exit(1);
  }

  // 2. Parse frontmatter
  const fileContents = fs.readFileSync(mdxPath, 'utf8');
  const { data, content } = matter(fileContents);

  // 3. Validate
  try {
    validate(data, slug);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  console.log(`Sending: "${data.title}" (id: ${data.id}, slug: ${slug})`);

  // 4. Render MDX → HTML + plain text
  process.stdout.write('Rendering MDX...');
  let htmlBody, textBody;
  try {
    ({ htmlBody, textBody } = await renderMDX(content, folder));
  } catch (err) {
    console.error(`\nError rendering MDX: ${err.message}`);
    process.exit(1);
  }
  console.log(' done.');

  // 5. Build event payload
  const eventId = crypto.randomUUID();
  const payload = {
    eventId,
    occurredAt: new Date().toISOString(),
    version: '1',
    emailId: Number(data.id),
    slug,
    title: data.title,
    htmlBody,
    textBody,
    viewInBrowserUrl: `${SITE_URL}/emails/${slug}`,
  };

  // 6. Emit
  process.stdout.write(isDryRun ? '' : 'Emitting NewsletterSendRequested...');
  try {
    emitEvent(payload);
  } catch (err) {
    console.error(`\nError: ${err.message}`);
    process.exit(1);
  }

  if (!isDryRun) {
    console.log(' done.');
    console.log(`\nEvent emitted successfully.`);
    console.log(`  eventId: ${eventId}`);
    console.log(`  emailId: ${data.id}`);
    console.log(`  slug:    ${slug}`);
    console.log('\nThe newsletter-dispatch-fn Lambda will handle delivery.');
  }
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
