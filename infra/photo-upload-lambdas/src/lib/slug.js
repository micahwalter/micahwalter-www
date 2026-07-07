/**
 * Slug / frontmatter helpers — ported from scripts/import-photos.js so that
 * web-uploaded posts are byte-for-byte consistent with CLI-imported ones.
 */

const path = require('path');

function generateSlug(filename) {
  const nameWithoutExt = path.parse(filename).name;
  let slug = nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Give generic camera filenames (IMG_1234, DSC0001, P1000123) a friendlier prefix.
  if (/^(img|dsc|p)?[-_]?\d+$/i.test(slug)) {
    slug = `photo-${slug}`;
  }
  return slug || 'photo';
}

function titleFromFilename(filename) {
  return path.parse(filename).name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function todayDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Build the index.md contents for a photo post.
 *
 * @param {object} data
 * @param {number} data.id
 * @param {string} data.title
 * @param {string} data.date           publishedAt (YYYY-MM-DD)
 * @param {string} data.excerpt
 * @param {string} data.category
 * @param {string[]} data.tags
 * @param {string} data.photoFilename  e.g. "photo.jpg"
 * @param {boolean} data.featured
 * @param {object} data.exif
 */
function buildFrontmatter(data) {
  const { id, title, date, excerpt, category, tags, photoFilename, featured, exif } = data;

  let fm = `---
type: photo
id: ${id}`;
  if (featured) fm += `\nfeatured: true`;
  fm += `
title: "${escapeYaml(title)}"
publishedAt: "${date}"
excerpt: "${escapeYaml(excerpt)}"
category: "${category}"
tags: [${tags.map((t) => `"${t}"`).join(', ')}]
coverImage: "./${photoFilename}"`;

  if (exif.camera) fm += `\ncamera: "${escapeYaml(exif.camera)}"`;
  if (exif.lens) fm += `\nlens: "${escapeYaml(exif.lens)}"`;
  if (exif.aperture) fm += `\naperture: "${exif.aperture}"`;
  if (exif.shutterSpeed) fm += `\nshutterSpeed: "${exif.shutterSpeed}"`;
  if (exif.iso) fm += `\niso: "${exif.iso}"`;
  if (exif.focalLength) fm += `\nfocalLength: "${exif.focalLength}"`;
  if (exif.dateTaken) fm += `\ndateTaken: "${exif.dateTaken}"`;

  fm += `
draft: false
---
`;
  return fm;
}

function escapeYaml(str) {
  return String(str).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

module.exports = { generateSlug, titleFromFilename, todayDate, buildFrontmatter };
