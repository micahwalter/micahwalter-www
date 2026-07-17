/**
 * DynamoDB access for micahwalter-galleries (PK = slug).
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  ScanCommand,
} = require('@aws-sdk/lib-dynamodb');

const TABLE = process.env.GALLERIES_TABLE;

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

function nowIso() {
  return new Date().toISOString();
}

function normalizePhotoIds(ids) {
  if (!Array.isArray(ids)) return [];
  return ids.map((id) => String(id)).filter(Boolean);
}

function slugify(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function getGallery(slug) {
  const res = await ddb.send(new GetCommand({
    TableName: TABLE,
    Key: { slug: String(slug) },
  }));
  return res.Item || null;
}

async function listGalleries({ includeDrafts = false } = {}) {
  const res = await ddb.send(new ScanCommand({ TableName: TABLE }));
  let items = res.Items || [];
  if (!includeDrafts) {
    items = items.filter((g) => !g.draft);
  }
  items.sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')));
  return items;
}

async function putGallery(gallery, { overwrite = false } = {}) {
  await ddb.send(new PutCommand({
    TableName: TABLE,
    Item: gallery,
    ...(overwrite ? {} : { ConditionExpression: 'attribute_not_exists(slug)' }),
  }));
  return gallery;
}

async function updateGallery(slug, patch) {
  const allowed = [
    'title',
    'description',
    'coverPhotoId',
    'publishedAt',
    'photoIds',
    'draft',
    'content',
  ];
  const names = {};
  const values = { ':u': nowIso() };
  const parts = ['updatedAt = :u'];

  for (const key of allowed) {
    if (patch[key] === undefined) continue;
    const nk = `#${key}`;
    const vk = `:${key}`;
    names[nk] = key;
    values[vk] = key === 'photoIds' ? normalizePhotoIds(patch[key]) : patch[key];
    parts.push(`${nk} = ${vk}`);
  }

  if (parts.length === 1) {
    throw Object.assign(new Error('No updatable fields'), { statusCode: 400 });
  }

  const res = await ddb.send(new UpdateCommand({
    TableName: TABLE,
    Key: { slug: String(slug) },
    UpdateExpression: `SET ${parts.join(', ')}`,
    ExpressionAttributeNames: Object.keys(names).length ? names : undefined,
    ExpressionAttributeValues: values,
    ConditionExpression: 'attribute_exists(slug)',
    ReturnValues: 'ALL_NEW',
  }));
  return res.Attributes;
}

function buildNewGallery({
  slug,
  title,
  description = '',
  coverPhotoId = null,
  publishedAt,
  photoIds = [],
  draft = false,
  content = '',
}) {
  const s = slugify(slug);
  if (!s) {
    throw Object.assign(new Error('slug is required'), { statusCode: 400 });
  }
  const t = String(title || '').trim();
  if (!t) {
    throw Object.assign(new Error('title is required'), { statusCode: 400 });
  }
  const now = nowIso();
  return {
    slug: s,
    title: t,
    description: String(description || ''),
    coverPhotoId: coverPhotoId != null && coverPhotoId !== '' ? String(coverPhotoId) : null,
    publishedAt: publishedAt || now.slice(0, 10),
    photoIds: normalizePhotoIds(photoIds),
    draft: !!draft,
    content: String(content || ''),
    createdAt: now,
    updatedAt: now,
  };
}

function toPublicGallery(gallery) {
  if (!gallery) return null;
  return {
    slug: gallery.slug,
    title: gallery.title,
    description: gallery.description || '',
    coverPhotoId: gallery.coverPhotoId ?? null,
    publishedAt: gallery.publishedAt,
    photoIds: gallery.photoIds || [],
    draft: !!gallery.draft,
    content: gallery.content || '',
    createdAt: gallery.createdAt,
    updatedAt: gallery.updatedAt,
  };
}

module.exports = {
  getGallery,
  listGalleries,
  putGallery,
  updateGallery,
  buildNewGallery,
  toPublicGallery,
  slugify,
  normalizePhotoIds,
  nowIso,
};
