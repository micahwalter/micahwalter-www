/**
 * Scheduled feed publisher — writes photo RSS + sitemap fragments to the
 * website bucket (no full Next.js rebuild), plus Open Graph HTML for
 * share crawlers.
 *
 * Env:
 *   PHOTOS_TABLE
 *   WEBSITE_BUCKET (e.g. micahwalter-www-website)
 *   SITE_URL (default https://www.micahwalter.com)
 *   EXPOSURES_TABLE (optional — Exposure OG pages)
 *   GALLERIES_TABLE (optional — gallery OG pages)
 *   DYNAMODB_REGION (optional)
 */

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { listPhotos, getFeaturedPhoto, getPhoto } = require('./lib/photos-db');
const { listExposures } = require('./lib/exposures-db');
const { listGalleries } = require('./lib/galleries-db');
const {
  htmlForPhoto,
  htmlForExposure,
  htmlForGallery,
  htmlForIndex,
  ogKeyForPhoto,
  ogKeyForExposure,
  ogKeyForGallery,
  photoOgImage,
} = require('./lib/og-html');

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

  const og = await publishOgHtml(photos);
  console.log(`Published OG HTML: ${JSON.stringify(og)}`);

  return { ok: true, count: photos.length, og };
};

async function listAllExposures() {
  const items = [];
  let cursor = null;
  do {
    const page = await listExposures({ limit: 50, cursor });
    items.push(...(page.items || []));
    cursor = page.cursor || null;
  } while (cursor);
  return items;
}

function isSafeSlug(slug) {
  return typeof slug === 'string' && /^[a-z0-9-]+$/.test(slug);
}

async function mapLimit(items, limit, fn) {
  const results = [];
  for (let i = 0; i < items.length; i += limit) {
    const chunk = items.slice(i, i + limit);
    results.push(...(await Promise.all(chunk.map(fn))));
  }
  return results;
}

async function publishOgHtml(photos) {
  const featured = (await getFeaturedPhoto()) || photos[0] || null;
  const featuredImage = featured ? photoOgImage(featured) : undefined;

  await putObject(
    'og/home.html',
    htmlForIndex({
      title: 'Micah Walter',
      description: 'Investigations in AI, Cloud, and Creativity',
      path: '/',
      image: featuredImage,
    }),
    'text/html; charset=utf-8',
  );
  await putObject(
    'og/photos.html',
    htmlForIndex({
      title: 'Photos',
      description: 'A collection of photos from my travels and daily life.',
      path: '/photos',
      image: featuredImage,
    }),
    'text/html; charset=utf-8',
  );

  await mapLimit(photos, 10, (photo) =>
    putObject(ogKeyForPhoto(photo.id), htmlForPhoto(photo), 'text/html; charset=utf-8'),
  );

  let exposures = [];
  if (process.env.EXPOSURES_TABLE) {
    exposures = await listAllExposures();
    await mapLimit(exposures, 10, (item) =>
      putObject(ogKeyForExposure(item.issueNumber), htmlForExposure(item), 'text/html; charset=utf-8'),
    );
    const latest = exposures[0];
    await putObject(
      'og/exposures.html',
      htmlForIndex({
        title: 'Exposures',
        description:
          'A periodic photo newsletter — one photograph and a few words, sent most Sundays.',
        path: '/exposures',
        image: latest
          ? photoOgImage({
              folderName: latest.folderName,
              coverImageKey: latest.coverImageKey,
            })
          : featuredImage,
      }),
      'text/html; charset=utf-8',
    );
  }

  let galleries = [];
  if (process.env.GALLERIES_TABLE) {
    galleries = (await listGalleries({ includeDrafts: false })) || [];
    let galleryIndexImage = featuredImage;
    await mapLimit(galleries, 5, async (gallery) => {
      if (!isSafeSlug(gallery.slug)) return;
      let cover = null;
      if (gallery.coverPhotoId) {
        try {
          cover = await getPhoto(gallery.coverPhotoId);
        } catch (err) {
          console.warn(`Gallery ${gallery.slug} cover fetch failed: ${err.message}`);
        }
      }
      if (!cover && Array.isArray(gallery.photoIds) && gallery.photoIds[0]) {
        try {
          cover = await getPhoto(gallery.photoIds[0]);
        } catch (err) {
          console.warn(`Gallery ${gallery.slug} first photo fetch failed: ${err.message}`);
        }
      }
      if (cover && cover.draft) cover = null;
      if (!galleryIndexImage && cover) galleryIndexImage = photoOgImage(cover);
      await putObject(
        ogKeyForGallery(gallery.slug),
        htmlForGallery(gallery, cover),
        'text/html; charset=utf-8',
      );
    });
    await putObject(
      'og/galleries.html',
      htmlForIndex({
        title: 'Galleries',
        description: 'Curated collections of photos.',
        path: '/galleries',
        image: galleryIndexImage,
      }),
      'text/html; charset=utf-8',
    );
  }

  return {
    photos: photos.length,
    exposures: exposures.length,
    galleries: galleries.length,
  };
}
