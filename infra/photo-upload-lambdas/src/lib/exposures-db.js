/**
 * DynamoDB access for Exposure archive (micahwalter-exposures).
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
} = require('@aws-sdk/lib-dynamodb');

const TABLE = process.env.EXPOSURES_TABLE;
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

function nowIso() {
  return new Date().toISOString();
}

/**
 * @param {object} input
 * @param {number|string} input.issueNumber
 * @param {string|number} input.photoId
 * @param {string} input.title
 * @param {string} [input.caption]
 * @param {string} [input.folderName]
 * @param {string} [input.coverImageKey]
 * @param {string} [input.sentAt]
 */
async function createExposure(input) {
  const issueNumber = String(input.issueNumber);
  const sentAt = input.sentAt || nowIso();
  const ts = nowIso();
  const item = {
    issueNumber,
    gsi1pk: 'EXPOSURE',
    gsi1sk: `${sentAt}#${issueNumber}`,
    photoId: String(input.photoId),
    title: String(input.title || '').trim() || 'Untitled',
    caption: input.caption != null ? String(input.caption) : '',
    folderName: input.folderName || '',
    coverImageKey: input.coverImageKey || '',
    sentAt,
    createdAt: ts,
  };

  await ddb.send(
    new PutCommand({
      TableName: TABLE,
      Item: item,
      ConditionExpression: 'attribute_not_exists(issueNumber)',
    }),
  );
  return item;
}

async function getExposure(n) {
  const res = await ddb.send(
    new GetCommand({
      TableName: TABLE,
      Key: { issueNumber: String(n) },
    }),
  );
  return res.Item || null;
}

async function listExposures({ limit = 12, cursor = null } = {}) {
  const lim = Math.min(Math.max(Number(limit) || 12, 1), 50);
  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: GSI1,
      KeyConditionExpression: 'gsi1pk = :pk',
      ExpressionAttributeValues: { ':pk': 'EXPOSURE' },
      ScanIndexForward: false,
      Limit: lim,
      ExclusiveStartKey: decodeCursor(cursor),
    }),
  );
  return {
    items: res.Items || [],
    cursor: encodeCursor(res.LastEvaluatedKey),
    limit: lim,
  };
}

function toPublicExposure(item) {
  if (!item) return null;
  return {
    issueNumber: Number(item.issueNumber),
    photoId: item.photoId,
    title: item.title,
    caption: item.caption || '',
    folderName: item.folderName || '',
    coverImageKey: item.coverImageKey || '',
    sentAt: item.sentAt,
    createdAt: item.createdAt,
  };
}

module.exports = {
  createExposure,
  getExposure,
  listExposures,
  toPublicExposure,
};
