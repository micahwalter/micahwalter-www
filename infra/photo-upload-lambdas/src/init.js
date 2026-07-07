/**
 * POST /photos/upload-url
 *
 * Validates the session token, then returns a presigned S3 PUT URL the browser
 * uses to upload the original photo directly to the uploads bucket. The chosen
 * title and the "feature on homepage" flag travel as object metadata so the
 * (decoupled) processing Lambda can read them when the S3 event fires.
 *
 * Direct-to-S3 upload sidesteps the API Gateway / Lambda request size limits,
 * which matters for multi-megabyte phone photos.
 */

const crypto = require('crypto');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { getSecret } = require('./lib/secrets');
const { verify } = require('./lib/token');

const s3 = new S3Client({});
const UPLOADS_BUCKET = process.env.UPLOADS_BUCKET;
const URL_TTL = 300; // presigned URL valid 5 minutes

// JPEG/PNG only for now. The default prebuilt sharp binary has no libheif, so
// HEIC/HEIF is a documented follow-up. In practice iOS Safari transcodes HEIC
// to JPEG when uploading through a file input, so this covers the phone case.
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png']);

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

function safeName(filename) {
  const base = path.basename(filename || 'photo');
  return base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 128) || 'photo';
}

exports.handler = async (event) => {
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { message: 'Invalid request body' });
  }

  const { token, filename, contentType, title, featured } = body;

  const secret = await getSecret();
  if (!verify(secret.hmac, token)) {
    return json(401, { message: 'Session expired or invalid' });
  }

  if (!ALLOWED_TYPES.has(contentType)) {
    return json(400, { message: 'Unsupported image type' });
  }

  const key = `uploads/incoming/${crypto.randomUUID()}/${safeName(filename)}`;

  // Metadata must be ASCII; base64-encode the (possibly unicode) title.
  const metadata = {
    title: Buffer.from(String(title || ''), 'utf8').toString('base64'),
    featured: featured ? 'true' : 'false',
    'orig-filename': safeName(filename),
  };

  const command = new PutObjectCommand({
    Bucket: UPLOADS_BUCKET,
    Key: key,
    ContentType: contentType,
    Metadata: metadata,
  });

  const url = await getSignedUrl(s3, command, {
    expiresIn: URL_TTL,
    // Metadata + Content-Type must be signed or S3 rejects the browser PUT
    // with "headers present in the request which were not signed".
    unhoistableHeaders: new Set([
      'x-amz-meta-title',
      'x-amz-meta-featured',
      'x-amz-meta-orig-filename',
    ]),
    signableHeaders: new Set(['content-type']),
  });

  // The client must send exactly these headers on the PUT — they are part of
  // the signature (SignedHeaders includes Content-Type and x-amz-meta-*).
  const headers = {
    'Content-Type': contentType,
    'x-amz-meta-title': metadata.title,
    'x-amz-meta-featured': metadata.featured,
    'x-amz-meta-orig-filename': metadata['orig-filename'],
  };

  return json(200, { url, headers, key });
};
