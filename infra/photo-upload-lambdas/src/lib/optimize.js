/**
 * Image optimization — ported from scripts/optimize-images.js. Produces the
 * same 400/800/1200px WebP + JPEG variants the CLI does, but returns Buffers
 * for upload to S3 instead of writing files to disk.
 */

const sharp = require('sharp');

const SIZES = [400, 800, 1200];
const WEBP_QUALITY = 85;
const JPEG_QUALITY = 85;

/**
 * @param {Buffer} buffer  Original image bytes
 * @param {string} baseName  Filename stem used in the output keys (e.g. "photo")
 * @returns {Promise<Array<{ filename: string, contentType: string, body: Buffer }>>}
 */
async function optimize(buffer, baseName) {
  const outputs = [];

  for (const size of SIZES) {
    // withoutEnlargement keeps small originals from being upscaled, matching
    // the CLI; we still emit every size so ResponsiveImage's srcset resolves.
    const resized = sharp(buffer).resize(size, size, {
      fit: 'inside',
      withoutEnlargement: true,
    });

    const webp = await resized.clone().webp({ quality: WEBP_QUALITY }).toBuffer();
    outputs.push({ filename: `${baseName}-${size}.webp`, contentType: 'image/webp', body: webp });

    const jpeg = await resized.clone().jpeg({ quality: JPEG_QUALITY }).toBuffer();
    outputs.push({ filename: `${baseName}-${size}.jpg`, contentType: 'image/jpeg', body: jpeg });
  }

  return outputs;
}

module.exports = { optimize, SIZES };
