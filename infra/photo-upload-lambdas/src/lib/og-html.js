/**
 * Open Graph HTML for share crawlers (LinkedIn, Slack, Twitter, etc.).
 * Written to the website bucket under og/*.html.
 */

function siteUrl() {
  return (process.env.SITE_URL || 'https://www.micahwalter.com').replace(/\/$/, '');
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function filenameStem(coverImageKey) {
  const key = coverImageKey || '';
  const base = key.split('/').pop() || 'photo';
  return base.replace(/\.(jpe?g|png|webp)$/i, '');
}

function photoOgImage(photo) {
  const base = siteUrl();
  const folder = photo && photo.folderName;
  if (!folder) return `${base}/share-card.jpg`;
  const stem = filenameStem(photo.coverImageKey);
  return `${base}/images/posts/${folder}/${stem}-1200.jpg`;
}

function buildOgHtml({
  title,
  description,
  url,
  image,
  type = 'website',
}) {
  const t = escapeHtml(title);
  const d = escapeHtml(description || '');
  const u = escapeHtml(url);
  const img = escapeHtml(image);
  const ty = escapeHtml(type);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${t}</title>
<meta name="description" content="${d}">
<link rel="canonical" href="${u}">
<meta property="og:site_name" content="Micah Walter">
<meta property="og:locale" content="en_US">
<meta property="og:type" content="${ty}">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${d}">
<meta property="og:url" content="${u}">
<meta property="og:image" content="${img}">
<meta property="og:image:width" content="1200">
<meta property="og:image:alt" content="${t}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${t}">
<meta name="twitter:description" content="${d}">
<meta name="twitter:image" content="${img}">
</head>
<body>
<p><a href="${u}"><img src="${img}" alt="${t}" width="1200"></a></p>
<h1>${t}</h1>
<p>${d}</p>
</body>
</html>
`;
}

function htmlForPhoto(photo) {
  const id = String(photo.id);
  const title = (photo.title || `Photo ${id}`).trim() || `Photo ${id}`;
  const description = (photo.caption || title).trim();
  return buildOgHtml({
    title,
    description,
    url: `${siteUrl()}/photos/${id}`,
    image: photoOgImage(photo),
    type: 'article',
  });
}

function htmlForExposure(exposure) {
  const n = String(exposure.issueNumber != null ? exposure.issueNumber : exposure.issueNumber);
  const rawTitle = (exposure.title || 'Untitled').trim() || 'Untitled';
  const title = `Exposure No. ${n} · ${rawTitle}`;
  const description = (exposure.caption || rawTitle).trim();
  const image = photoOgImage({
    folderName: exposure.folderName,
    coverImageKey: exposure.coverImageKey,
  });
  return buildOgHtml({
    title,
    description,
    url: `${siteUrl()}/exposures/${n}`,
    image,
    type: 'article',
  });
}

function htmlForGallery(gallery, coverPhoto) {
  const slug = gallery.slug;
  const title = (gallery.title || slug).trim();
  const description = (gallery.description || title).trim();
  const image = coverPhoto ? photoOgImage(coverPhoto) : `${siteUrl()}/share-card.jpg`;
  return buildOgHtml({
    title,
    description,
    url: `${siteUrl()}/galleries/${encodeURIComponent(slug)}`,
    image,
    type: 'website',
  });
}

function htmlForIndex({ title, description, path, image }) {
  return buildOgHtml({
    title,
    description,
    url: `${siteUrl()}${path}`,
    image: image || `${siteUrl()}/share-card.jpg`,
    type: 'website',
  });
}

function ogKeyForPhoto(id) {
  return `og/photos/${id}.html`;
}

function ogKeyForExposure(n) {
  return `og/exposures/${n}.html`;
}

function ogKeyForGallery(slug) {
  return `og/galleries/${slug}.html`;
}

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

let s3Client;

function s3() {
  if (!s3Client) s3Client = new S3Client({});
  return s3Client;
}

async function putOgHtml(key, html) {
  const bucket = process.env.WEBSITE_BUCKET;
  if (!bucket) return { skipped: true };
  await s3().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: html,
      ContentType: 'text/html; charset=utf-8',
      CacheControl: 'public, max-age=300',
    }),
  );
  return { key };
}

async function writePhotoOg(photo) {
  if (!photo || photo.draft) return { skipped: true };
  return putOgHtml(ogKeyForPhoto(photo.id), htmlForPhoto(photo));
}

async function writeExposureOg(exposure) {
  if (!exposure) return { skipped: true };
  await putOgHtml(
    ogKeyForExposure(exposure.issueNumber != null ? exposure.issueNumber : exposure.issueNumber),
    htmlForExposure(exposure),
  );
  await putOgHtml(
    'og/exposures.html',
    htmlForIndex({
      title: 'Exposures',
      description:
        'A periodic photo newsletter — one photograph and a few words, sent most Sundays.',
      path: '/exposures',
      image: photoOgImage({
        folderName: exposure.folderName,
        coverImageKey: exposure.coverImageKey,
      }),
    }),
  );
  return { ok: true };
}

module.exports = {
  escapeHtml,
  filenameStem,
  photoOgImage,
  buildOgHtml,
  htmlForPhoto,
  htmlForExposure,
  htmlForGallery,
  htmlForIndex,
  ogKeyForPhoto,
  ogKeyForExposure,
  ogKeyForGallery,
  siteUrl,
  putOgHtml,
  writePhotoOg,
  writeExposureOg,
};
