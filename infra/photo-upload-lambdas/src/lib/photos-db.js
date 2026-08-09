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
const DDB_REGION = process.env.DYNAMODB_REGION || process.env.AWS_REGION;

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: DDB_REGION }), {
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

/** Idempotent upsert for migration / CLI (overwrites by id). */
async function upsertPhoto(photo) {
  await ddb.send(new PutCommand({
    TableName: TABLE,
    Item: photo,
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
  const allowed = ['title', 'caption', 'tags', 'featured', 'draft', 'exposureEligible'];
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

/**
 * Public photos eligible for Exposure and not yet sent.
 * Paginates the newest-first GSI (personal-scale catalog).
 *
 * Note: buildNewPhoto historically wrote exposureSentAt: null. DynamoDB NULL
 * still "exists", so attribute_not_exists alone misses those rows — treat null
 * as unsent as well.
 */
async function listExposureCandidates({ maxItems = 100 } = {}) {
  const out = [];
  let ExclusiveStartKey;
  const cap = Math.min(Math.max(Number(maxItems) || 100, 1), 200);

  do {
    const res = await ddb.send(
      new QueryCommand({
        TableName: TABLE,
        IndexName: GSI1,
        KeyConditionExpression: 'gsi1pk = :pk',
        ExpressionAttributeValues: {
          ':pk': 'PHOTO',
          ':false': false,
          ':true': true,
          ':null': null,
        },
        FilterExpression:
          'draft = :false AND exposureEligible = :true AND (attribute_not_exists(exposureSentAt) OR exposureSentAt = :null)',
        ScanIndexForward: false,
        Limit: 50,
        ExclusiveStartKey,
      }),
    );
    for (const item of res.Items || []) {
      out.push(item);
      if (out.length >= cap) {
        return out;
      }
    }
    ExclusiveStartKey = res.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  return out;
}

/**
 * Stamp a photo as sent in a production Exposure. Fails if already stamped.
 */
async function stampExposureSent(id, { sentAt, issueNumber }) {
  const res = await ddb.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { id: String(id) },
      UpdateExpression:
        'SET exposureSentAt = :s, exposureIssueNumber = :n, updatedAt = :u',
      ExpressionAttributeValues: {
        ':s': sentAt,
        ':n': Number(issueNumber),
        ':u': nowIso(),
        ':null': null,
      },
      ConditionExpression:
        'attribute_exists(id) AND (attribute_not_exists(exposureSentAt) OR exposureSentAt = :null)',
      ReturnValues: 'ALL_NEW',
    }),
  );
  return res.Attributes;
}

module.exports = {
  putPhoto,
  upsertPhoto,
  getPhoto,
  updatePhoto,
  updatePhotoEnrichment,
  listPhotos,
  getFeaturedPhoto,
  listExposureCandidates,
  stampExposureSent,
  encodeCursor,
  decodeCursor,
  gsiKeys,
};
