/**
 * S3 ObjectCreated trigger on uploads/incoming/*
 *
 * Downloads the original, extracts EXIF, optimizes variants to the images
 * bucket, allocates a ticket id, writes DynamoDB (no GitHub commit), and
 * emits a best-effort EventBridge enrichment event for U2.
 */

const path = require('path');
const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');

const { getSecret } = require('./lib/secrets');
const { extractExif } = require('./lib/exif');
const { optimize } = require('./lib/optimize');
const { generateSlug } = require('./lib/slug');
const { allocatePostId } = require('./lib/tickets');
const {
  defaultTitle,
  defaultCaption,
  buildNewPhoto,
  todayDate,
} = require('./lib/photo-defaults');
const { putPhoto } = require('./lib/photos-db');

const s3 = new S3Client({});
const events = new EventBridgeClient({});

const IMAGES_BUCKET = process.env.IMAGES_BUCKET;
const EVENT_BUS_NAME = process.env.PHOTO_EVENT_BUS || 'photo-bus';
const CACHE_CONTROL = 'public, max-age=31536000, immutable';

async function streamToBuffer(stream) {
  const bytes = await stream.transformToByteArray();
  return Buffer.from(bytes);
}

async function emitEnrichmentEvent(photoId) {
  try {
    await events.send(new PutEventsCommand({
      Entries: [
        {
          EventBusName: EVENT_BUS_NAME,
          Source: 'micahwalter.photos',
          DetailType: 'PhotoPendingEnrichment',
          Detail: JSON.stringify({ photoId: String(photoId) }),
        },
      ],
    }));
  } catch (err) {
    console.error(`Enrichment PutEvents failed for ${photoId}:`, err.message);
  }
}

async function processObject(bucket, key) {
  console.log(`Processing s3://${bucket}/${key}`);

  const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const buffer = await streamToBuffer(obj.Body);
  const metadata = obj.Metadata || {};

  const origFilename = metadata['orig-filename'] || path.basename(key);
  const titleMeta = metadata.title
    ? Buffer.from(metadata.title, 'base64').toString('utf8').trim()
    : '';
  const captionMeta = metadata.caption
    ? Buffer.from(metadata.caption, 'base64').toString('utf8')
    : '';
  const featured = metadata.featured === 'true';

  const ext = (path.extname(origFilename) || '.jpg').toLowerCase();
  const photoFilename = `photo${ext}`;

  const date = todayDate();
  const slug = generateSlug(origFilename);
  const folder = `${date}-${slug}`;

  const exif = await extractExif(buffer);

  let variants;
  try {
    variants = await optimize(buffer, 'photo');
  } catch (err) {
    console.error('Optimize failed — no DynamoDB write:', err.message);
    throw err;
  }

  await Promise.all([
    ...variants.map((v) =>
      s3.send(new PutObjectCommand({
        Bucket: IMAGES_BUCKET,
        Key: `images/posts/${folder}/${v.filename}`,
        Body: v.body,
        ContentType: v.contentType,
        CacheControl: CACHE_CONTROL,
      }))
    ),
    s3.send(new PutObjectCommand({
      Bucket: IMAGES_BUCKET,
      Key: `images/originals/posts/${folder}/${photoFilename}`,
      Body: buffer,
      ContentType: obj.ContentType || 'application/octet-stream',
      CacheControl: CACHE_CONTROL,
    })),
  ]);

  const secret = await getSecret();
  if (!secret.ticketsPasscode) {
    throw new Error('photo-upload-secrets missing ticketsPasscode');
  }

  let id;
  try {
    id = await allocatePostId(secret.ticketsPasscode);
  } catch (err) {
    console.error('Ticket allocation failed — no DynamoDB write:', err.message);
    throw err;
  }

  const title = defaultTitle(titleMeta, origFilename);
  const caption = defaultCaption(captionMeta, exif);

  const photo = buildNewPhoto({
    id,
    title,
    caption,
    featured,
    folderName: folder,
    coverImageKey: `images/posts/${folder}/${photoFilename}`,
    originalKey: `images/originals/posts/${folder}/${photoFilename}`,
    exif,
  });

  await putPhoto(photo);
  console.log(`Wrote photo id ${id} folder ${folder} (enrichment pending)`);

  await emitEnrichmentEvent(id);

  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

exports.handler = async (event) => {
  for (const record of event.Records || []) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    if (!key.startsWith('uploads/incoming/')) {
      console.log(`Skipping unexpected key: ${key}`);
      continue;
    }
    await processObject(bucket, key);
  }
  return { ok: true };
};
