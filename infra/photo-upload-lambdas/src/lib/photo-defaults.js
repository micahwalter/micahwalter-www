/**
 * Title/caption defaults and GSI key helpers for photo records.
 */

const { titleFromFilename, todayDate } = require('./slug');

function defaultTitle(titleMeta, origFilename) {
  const t = (titleMeta || '').trim();
  return t || titleFromFilename(origFilename || 'photo');
}

function defaultCaption(captionMeta, exif) {
  const c = (captionMeta || '').trim();
  if (c) return c;
  if (exif && exif.camera) return `Photo taken with ${exif.camera}`;
  return '';
}

function gsiKeys(publishedAt, id) {
  return {
    gsi1pk: 'PHOTO',
    gsi1sk: `${publishedAt}#${id}`,
  };
}

function nowIso() {
  return new Date().toISOString();
}

/**
 * Build a new Photo item for DynamoDB (enrichmentStatus pending).
 */
function buildNewPhoto({
  id,
  title,
  caption,
  featured,
  exposureEligible = false,
  folderName,
  coverImageKey,
  originalKey,
  exif,
  draft = false,
  tags = ['photography'],
  category = 'Photography',
}) {
  const publishedAt = todayDate();
  const ts = nowIso();
  const idStr = String(id);
  return {
    id: idStr,
    ...gsiKeys(publishedAt, idStr),
    title,
    caption,
    publishedAt,
    createdAt: ts,
    updatedAt: ts,
    featured: !!featured,
    draft: !!draft,
    tags: Array.isArray(tags) ? tags : ['photography'],
    enrichmentStatus: 'pending',
    folderName,
    coverImageKey,
    originalKey,
    category,
    exif: exif || {},
    latitude: null,
    longitude: null,
    publicLatitude: null,
    publicLongitude: null,
    exposureEligible: !!exposureEligible,
    // Omit exposureSentAt / exposureIssueNumber until a production send stamps
    // them. Writing null stores DynamoDB NULL, which breaks attribute_not_exists
    // filters used by the Sunday orchestrator.
  };
}

module.exports = {
  defaultTitle,
  defaultCaption,
  gsiKeys,
  nowIso,
  buildNewPhoto,
  todayDate,
};
