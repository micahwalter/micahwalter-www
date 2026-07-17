/**
 * Scheduled feed publisher — writes photo RSS + sitemap fragments to the
 * website bucket (no full Next.js rebuild).
 *
 * Env:
 *   PHOTOS_TABLE
 *   WEBSITE_BUCKET (e.g. micahwalter-www-website)
 *   SITE_URL (default https://www.micahwalter.com)
 *   DYNAMODB_REGION (optional)
 */

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { listPhotos } = require('./lib/photos-db');

const s3 = new S3Client({});
const WEBSITE_BUCKET = process.env.WEBSITE_BUCKET;
const SITE_URL = (process.env.SITE_URL || 'https://www.micahwalter.com').replace(/\/$/, '');

function escapeXml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function listAllPhotos() {
  const items = [];
  let cursor;
  do {
    const page = await listPhotos({ limit: 50, cursor });
    items.push(...(page.items || []));
    cursor = page.cursor || undefined;
  } while (cursor);
  return items;
}

function buildRss(photos) {
  const items = photos
    .map((p) => {
      const link = `${SITE_URL}/photos/${p.id}`;
      const title = escapeXml(p.title || `Photo ${p.id}`);
      const desc = escapeXml(p.caption || '');
      const pub = p.publishedAt || p.createdAt || new Date().toISOString().slice(0, 10);
      return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${new Date(pub).toUTCString()}</pubDate>
      <description>${desc}</description>
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Micah Walter — Photos</title>
    <link>${SITE_URL}/photos</link>
    <description>Photo feed from DynamoDB (scheduled)</description>
    <atom:link href="${SITE_URL}/photos-feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
}

function buildSitemap(photos) {
  const urls = photos
    .map((p) => {
      const loc = `${SITE_URL}/photos/${p.id}`;
      const lastmod = (p.updatedAt || p.publishedAt || '').slice(0, 10);
      return `  <url>
    <loc>${loc}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.w3.org/2000/sitemap/0.9">
${urls}
</urlset>
`;
}

async function putObject(key, body, contentType) {
  await s3.send(
    new PutObjectCommand({
      Bucket: WEBSITE_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: 'public, max-age=300',
    }),
  );
  console.log(`Wrote s3://${WEBSITE_BUCKET}/${key} (${body.length} bytes)`);
}

exports.handler = async () => {
  if (!WEBSITE_BUCKET) throw new Error('WEBSITE_BUCKET is not set');
  if (!process.env.PHOTOS_TABLE) throw new Error('PHOTOS_TABLE is not set');

  const photos = await listAllPhotos();
  console.log(`Publishing ${photos.length} photo(s)`);

  await putObject('photos-feed.xml', buildRss(photos), 'application/rss+xml; charset=utf-8');
  await putObject('sitemap-photos.xml', buildSitemap(photos), 'application/xml; charset=utf-8');

  return { ok: true, count: photos.length };
};
