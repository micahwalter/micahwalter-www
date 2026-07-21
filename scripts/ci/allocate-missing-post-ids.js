#!/usr/bin/env node
/**
 * CI helper: allocate ticket ids for blog/email posts missing frontmatter id.
 *
 * Usage:
 *   node scripts/ci/allocate-missing-post-ids.js --files path1 path2 ...
 *   node scripts/ci/allocate-missing-post-ids.js --backfill path1 ...
 *
 * Env:
 *   TICKETS_ALLOCATE_URL  default https://api.micahwalter.com/tickets/allocate
 *   AWS_REGION            default us-east-1
 *
 * Requires IAM credentials that can execute-api:Invoke the allocate route.
 * Does not use or log the ticket passcode.
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { SignatureV4 } = require('@aws-sdk/signature-v4');
const { HttpRequest } = require('@smithy/protocol-http');
const { defaultProvider } = require('@aws-sdk/credential-provider-node');
const { Sha256 } = require('@aws-crypto/sha256-js');

const DEFAULT_URL = 'https://api.micahwalter.com/tickets/allocate';

function parseArgs(argv) {
  const files = [];
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--files' || a === '--backfill') {
      while (argv[i + 1] && !argv[i + 1].startsWith('--')) {
        files.push(argv[++i]);
      }
    } else if (!a.startsWith('--')) {
      files.push(a);
    }
  }
  return { files };
}

function isPostIndex(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  return /content\/posts\/[^/]+\/index\.md$/.test(normalized);
}

function needsId(filePath) {
  if (!isPostIndex(filePath) || !fs.existsSync(filePath)) return false;
  const { data } = matter(fs.readFileSync(filePath, 'utf8'));
  if (data.type === 'photo') return false;
  if (data.id != null && data.id !== '') return false;
  return true;
}

function applyId(filePath, id) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data } = matter(raw);
  if (data.id != null && data.id !== '') return false;

  const updated = raw.replace(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/, (match, fm) => {
    const lines = fm.split(/\r?\n/).filter((line) => !/TODO:.*(ticket|allocate|\bid\b)/i.test(line));
    if (!lines.some((line) => /^id:\s/.test(line))) {
      lines.unshift(`id: ${id}`);
    }
    return `---\n${lines.join('\n')}\n---\n`;
  });

  if (updated === raw) {
    throw new Error(`could not patch frontmatter in ${filePath}`);
  }
  fs.writeFileSync(filePath, updated);
  return true;
}

async function allocateId(url) {
  const parsed = new URL(url);
  const body = '{}';
  const request = new HttpRequest({
    method: 'POST',
    protocol: parsed.protocol,
    hostname: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : undefined,
    path: `${parsed.pathname}${parsed.search}`,
    headers: {
      host: parsed.hostname,
      'content-type': 'application/json',
      'content-length': String(Buffer.byteLength(body)),
    },
    body,
  });

  const signer = new SignatureV4({
    credentials: defaultProvider(),
    region: process.env.AWS_REGION || 'us-east-1',
    service: 'execute-api',
    sha256: Sha256,
  });
  const signed = await signer.sign(request);
  const res = await fetch(url, {
    method: 'POST',
    headers: signed.headers,
    body,
  });
  const text = await res.text();
  let json = {};
  try {
    json = JSON.parse(text);
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    throw new Error(`allocate failed (${res.status}): ${text}`);
  }
  if (typeof json.id !== 'number') {
    throw new Error(`allocate response missing id: ${text}`);
  }
  return json.id;
}

async function main() {
  const { files } = parseArgs(process.argv);
  if (!files.length) {
    console.log('No files provided; nothing to do.');
    return;
  }

  const url = (process.env.TICKETS_ALLOCATE_URL || DEFAULT_URL).replace(/\/$/, '');
  const candidates = [...new Set(files)].filter(needsId);
  if (!candidates.length) {
    console.log('No blog/email posts missing id among:', files.join(', '));
    return;
  }

  console.log(`Allocating ids for ${candidates.length} file(s) via ${url}`);
  let changed = 0;
  for (const file of candidates) {
    const id = await allocateId(url);
    const did = applyId(file, id);
    console.log(`${did ? 'set' : 'skip'} id=${id} → ${file}`);
    if (did) changed += 1;
  }
  console.log(`Updated ${changed} file(s).`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
