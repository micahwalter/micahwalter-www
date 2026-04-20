#!/usr/bin/env node

/**
 * Fetches all original toots from @micah@micah.social at build time.
 * Writes public/mastodon.json for use by the /micro pages.
 *
 * Skips replies and boosts. Paginates via Link header until exhausted.
 */

const fs = require("fs");
const path = require("path");

const INSTANCE = "https://micah.social";
const ACCT = "micah";
const OUT_PATH = path.join(__dirname, "../public/mastodon.json");

async function lookupAccountId() {
  const res = await fetch(`${INSTANCE}/api/v1/accounts/lookup?acct=${ACCT}`);
  if (!res.ok) throw new Error(`Account lookup failed: ${res.status}`);
  const data = await res.json();
  return data.id;
}

function extractNextUrl(linkHeader) {
  if (!linkHeader) return null;
  const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
  return match ? match[1] : null;
}

async function fetchAllStatuses(accountId) {
  const statuses = [];
  let url = `${INSTANCE}/api/v1/accounts/${accountId}/statuses?exclude_replies=true&exclude_reblogs=true&limit=40`;

  while (url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Statuses fetch failed: ${res.status} ${url}`);
    const page = await res.json();
    if (page.length === 0) break;
    statuses.push(...page);
    url = extractNextUrl(res.headers.get("link"));
  }

  return statuses;
}

function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<p>/gi, "")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function summarize(plainText) {
  const first = plainText.split("\n")[0].trim();
  return first.length > 120 ? first.slice(0, 117) + "…" : first;
}

function normalizeToot(status) {
  const plain = stripHtml(status.content);
  return {
    id: status.id,
    url: status.url,
    createdAt: status.created_at,
    content: status.content,
    plainText: plain,
    summary: summarize(plain),
    sensitive: status.sensitive,
    spoilerText: status.spoiler_text || "",
    visibility: status.visibility,
    mediaAttachments: (status.media_attachments || []).map((m) => ({
      id: m.id,
      type: m.type,
      url: m.url,
      previewUrl: m.preview_url,
      description: m.description || "",
      meta: m.meta || {},
    })),
    tags: (status.tags || []).map((t) => t.name),
    favouritesCount: status.favourites_count,
    reblogsCount: status.reblogs_count,
    repliesCount: status.replies_count,
  };
}

async function main() {
  console.log("Fetching Mastodon toots for @micah@micah.social...");

  let accountId;
  try {
    accountId = await lookupAccountId();
  } catch (err) {
    console.warn(`fetch-mastodon: could not reach API (${err.message}). Keeping existing mastodon.json.`);
    return;
  }
  console.log(`Account ID: ${accountId}`);

  const raw = await fetchAllStatuses(accountId);
  console.log(`Fetched ${raw.length} toots`);

  const toots = raw.map(normalizeToot);

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(toots, null, 2));
  console.log(`Wrote ${OUT_PATH}`);
}

main().catch((err) => {
  console.error("fetch-mastodon error:", err.message);
  process.exit(1);
});
