/**
 * Enrichment worker — EventBridge PhotoPendingEnrichment → geo + Bedrock tags.
 */

const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getPhoto, updatePhotoEnrichment } = require('./lib/photos-db');
const { extractGps } = require('./lib/exif');
const { fuzzPublicCoords } = require('./lib/geo');
const { reverseGeocode } = require('./lib/location');
const { suggestTags } = require('./lib/bedrock-tags');
const { mergeTags } = require('./lib/tag-merge');
const { bedrockCoverCandidates, originalKey } = require('./lib/image-keys');

const s3 = new S3Client({});
const IMAGES_BUCKET = process.env.IMAGES_BUCKET;

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function getObjectBuffer(key) {
  const obj = await s3.send(new GetObjectCommand({
    Bucket: IMAGES_BUCKET,
    Key: key,
  }));
  const buffer = await streamToBuffer(obj.Body);
  return { buffer, contentType: obj.ContentType, key };
}

async function loadFirstExisting(keys) {
  for (const key of keys) {
    if (!key) continue;
    try {
      return await getObjectBuffer(key);
    } catch (err) {
      if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) continue;
      console.warn(`S3 get ${key}:`, err.message);
    }
  }
  return null;
}

function parseDetail(event) {
  if (event?.detail && typeof event.detail === 'object') return event.detail;
  if (typeof event?.detail === 'string') {
    try {
      return JSON.parse(event.detail);
    } catch {
      return {};
    }
  }
  return {};
}

function parsePhotoId(event) {
  const detail = parseDetail(event);
  if (detail.photoId) return String(detail.photoId);
  return null;
}

function parseForce(event) {
  return parseDetail(event).force === true;
}

async function enrichPhoto(photoId, { force = false } = {}) {
  const photo = await getPhoto(photoId);
  if (!photo) {
    console.warn(`enrich: photo ${photoId} not found`);
    return { ok: false, reason: 'not_found' };
  }

  if (photo.enrichmentStatus === 'complete' && !force) {
    console.log(`enrich: photo ${photoId} already complete — no-op`);
    return { ok: true, skipped: true };
  }

  let hasGps = false;
  let geoOk = false;
  let bedrockOk = false;

  let latitude = null;
  let longitude = null;
  let publicLatitude = null;
  let publicLongitude = null;
  let city = null;
  let country = null;
  const geoTags = [];

  // GPS from original
  try {
    const origKey = originalKey(photo);
    if (origKey && IMAGES_BUCKET) {
      const orig = await loadFirstExisting([
        origKey,
        photo.folderName ? `images/originals/posts/${photo.folderName}/photo.jpg` : null,
        photo.folderName ? `images/originals/posts/${photo.folderName}/photo.jpeg` : null,
        photo.folderName ? `images/originals/posts/${photo.folderName}/photo.png` : null,
      ].filter(Boolean));
      if (orig) {
        const gps = await extractGps(orig.buffer);
        if (gps.latitude != null && gps.longitude != null) {
          hasGps = true;
          latitude = gps.latitude;
          longitude = gps.longitude;
          const fuzzed = fuzzPublicCoords(latitude, longitude);
          publicLatitude = fuzzed.publicLatitude;
          publicLongitude = fuzzed.publicLongitude;
        }
      }
    }
  } catch (err) {
    console.error(`enrich GPS step failed for ${photoId}:`, err.message);
  }

  // Reverse geocode
  if (hasGps) {
    try {
      const place = await reverseGeocode(latitude, longitude);
      city = place.city;
      country = place.country;
      if (place.cityTag) geoTags.push(place.cityTag);
      if (place.countryTag) geoTags.push(place.countryTag);
      geoOk = !!(city || country);
    } catch (err) {
      console.error(`enrich Location step failed for ${photoId}:`, err.message);
    }
  }

  // Bedrock on optimized cover
  let aiTags = [];
  try {
    const cover = await loadFirstExisting(bedrockCoverCandidates(photo));
    if (cover) {
      aiTags = await suggestTags(cover.buffer, {
        contentType: cover.contentType,
        key: cover.key,
      });
      bedrockOk = aiTags.length > 0;
    } else {
      console.warn(`enrich: no cover image for Bedrock on ${photoId}`);
    }
  } catch (err) {
    console.error(`enrich Bedrock step failed for ${photoId}:`, err.message);
  }

  // Force re-enrich rebuilds tags from defaults + new geo/AI so bad place tags
  // (e.g. wrong-hemisphere geocode) do not stick forever via merge-only updates.
  const baseTags = force ? ['photography'] : (photo.tags || []);
  const tags = mergeTags(baseTags, geoTags, aiTags);

  const fields = {
    tags,
    enrichmentStatus: 'complete',
  };

  if (hasGps) {
    fields.latitude = latitude;
    fields.longitude = longitude;
    fields.publicLatitude = publicLatitude;
    fields.publicLongitude = publicLongitude;
  }
  if (force || city != null) fields.city = city;
  if (force || country != null) fields.country = country;

  try {
    await updatePhotoEnrichment(photoId, fields);
  } catch (err) {
    console.error(`enrich DynamoDB update failed for ${photoId}:`, err.message);
    try {
      await updatePhotoEnrichment(photoId, { enrichmentStatus: 'failed' });
    } catch (err2) {
      console.error(`enrich failed to mark failed for ${photoId}:`, err2.message);
    }
    throw err;
  }

  console.log(JSON.stringify({
    msg: 'enrich complete',
    photoId,
    hasGps,
    geoOk,
    bedrockOk,
    tagCount: tags.length,
    enrichmentStatus: 'complete',
  }));

  return { ok: true, hasGps, geoOk, bedrockOk };
}

exports.handler = async (event) => {
  // EventBridge may batch; also support direct invoke with detail
  const events = event?.Records
    ? event.Records.map((r) => (typeof r.body === 'string' ? JSON.parse(r.body) : r))
    : [event];

  for (const ev of events) {
    const photoId = parsePhotoId(ev);
    if (!photoId) {
      console.warn('enrich: missing photoId', JSON.stringify(ev)?.slice(0, 200));
      continue;
    }
    await enrichPhoto(photoId, { force: parseForce(ev) });
  }

  return { ok: true };
};

exports.enrichPhoto = enrichPhoto;
exports.parsePhotoId = parsePhotoId;
exports.parseForce = parseForce;
