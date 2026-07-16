/**
 * DynamoDB access for micahwalter-photos.
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  QueryCommand,
} = require('@aws-sdk/lib-dynamodb');
const { nowIso, gsiKeys } = require('./photo-defaults');

const TABLE = process.env.PHOTOS_TABLE;
const GSI1 = 'GSI1';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

function encodeCursor(key) {
  if (!key) return null;
  return Buffer.from(JSON.stringify(key), 'utf8').toString('base64url');
}

function decodeCursor(cursor) {
  if (!cursor) return undefined;
  try {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
  } catch {
    return undefined;
  }
}

async function putPhoto(photo) {
  await ddb.send(new PutCommand({
    TableName: TABLE,
    Item: photo,
    ConditionExpression: 'attribute_not_exists(id)',
  }));
  return photo;
}

async function getPhoto(id) {
  const res = await ddb.send(new GetCommand({
    TableName: TABLE,
    Key: { id: String(id) },
  }));
  return res.Item || null;
}

/**
 * Partial update for owner PATCH. Rebuilds GSI keys if publishedAt changes (not allowed in U1).
 */
async function updatePhoto(id, patch) {
  const allowed = ['title', 'caption', 'tags', 'featured', 'draft'];
  const names = {};
  const values = { ':u': nowIso() };
  const parts = ['updatedAt = :u'];

  for (const key of allowed) {
    if (patch[key] === undefined) continue;
    const nk = `#${key}`;
    const vk = `:${key}`;
    names[nk] = key;
    values[vk] = patch[key];
    parts.push(`${nk} = ${vk}`);
  }

  if (parts.length === 1) {
    throw Object.assign(new Error('No updatable fields'), { statusCode: 400 });
  }

  const res = await ddb.send(new UpdateCommand({
    TableName: TABLE,
    Key: { id: String(id) },
    UpdateExpression: `SET ${parts.join(', ')}`,
    ExpressionAttributeNames: Object.keys(names).length ? names : undefined,
    ExpressionAttributeValues: values,
    ConditionExpression: 'attribute_exists(id)',
    ReturnValues: 'ALL_NEW',
  }));
  return res.Attributes;
}

/**
 * Enrichment worker update — geo, place, tags, status.
 */
async function updatePhotoEnrichment(id, fields) {
  const allowed = [
    'latitude',
    'longitude',
    'publicLatitude',
    'publicLongitude',
    'city',
    'country',
    'tags',
    'enrichmentStatus',
  ];
  const names = {};
  const values = { ':u': nowIso() };
  const parts = ['updatedAt = :u'];

  for (const key of allowed) {
    if (fields[key] === undefined) continue;
    const nk = `#${key}`;
    const vk = `:${key}`;
    names[nk] = key;
    values[vk] = fields[key];
    parts.push(`${nk} = ${vk}`);
  }

  if (parts.length === 1) {
    throw Object.assign(new Error('No enrichment fields'), { statusCode: 400 });
  }

  const res = await ddb.send(new UpdateCommand({
    TableName: TABLE,
    Key: { id: String(id) },
    UpdateExpression: `SET ${parts.join(', ')}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
    ConditionExpression: 'attribute_exists(id)',
    ReturnValues: 'ALL_NEW',
  }));
  return res.Attributes;
}

/**
 * Newest-first public list (drafts excluded via FilterExpression).
 */
async function listPhotos({ limit = 12, cursor } = {}) {
  const res = await ddb.send(new QueryCommand({
    TableName: TABLE,
    IndexName: GSI1,
    KeyConditionExpression: 'gsi1pk = :pk',
    ExpressionAttributeValues: {
      ':pk': 'PHOTO',
      ':false': false,
    },
    FilterExpression: 'draft = :false',
    ScanIndexForward: false,
    Limit: Math.min(Math.max(Number(limit) || 12, 1), 50),
    ExclusiveStartKey: decodeCursor(cursor),
  }));

  return {
    items: res.Items || [],
    cursor: encodeCursor(res.LastEvaluatedKey),
  };
}

/**
 * Newest featured non-draft, else newest non-draft overall.
 */
async function getFeaturedPhoto() {
  // Pull a window of newest public photos and pick featured, else first.
  const res = await ddb.send(new QueryCommand({
    TableName: TABLE,
    IndexName: GSI1,
    KeyConditionExpression: 'gsi1pk = :pk',
    ExpressionAttributeValues: {
      ':pk': 'PHOTO',
      ':false': false,
    },
    FilterExpression: 'draft = :false',
    ScanIndexForward: false,
    Limit: 50,
  }));

  const items = res.Items || [];
  if (items.length === 0) return null;
  return items.find((p) => p.featured === true) || items[0];
}

module.exports = {
  putPhoto,
  getPhoto,
  updatePhoto,
  updatePhotoEnrichment,
  listPhotos,
  getFeaturedPhoto,
  encodeCursor,
  decodeCursor,
  gsiKeys,
};
