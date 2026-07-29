/**
 * Dedicated Exposure issue-number counter + daily run lock.
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  UpdateCommand,
  PutCommand,
} = require('@aws-sdk/lib-dynamodb');

const TABLE = process.env.EXPOSURE_COUNTER_TABLE;
const DDB_REGION = process.env.DYNAMODB_REGION || process.env.AWS_REGION;
const COUNTER_ID = 'exposure';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: DDB_REGION }), {
  marshallOptions: { removeUndefinedValues: true },
});

function nowIso() {
  return new Date().toISOString();
}

/** Atomically increment and return the new issue number (1, 2, 3…). */
async function allocateNextIssueNumber() {
  const res = await ddb.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { id: COUNTER_ID },
      UpdateExpression: 'ADD #c :one SET updatedAt = :u',
      ExpressionAttributeNames: { '#c': 'current' },
      ExpressionAttributeValues: { ':one': 1, ':u': nowIso() },
      ReturnValues: 'UPDATED_NEW',
    }),
  );
  return Number(res.Attributes.current);
}

/**
 * Try to acquire a once-per-calendar-day lock (America/New_York date string).
 * @returns {boolean} true if this invocation owns the run
 */
async function tryAcquireDailyLock(dateKey) {
  try {
    await ddb.send(
      new PutCommand({
        TableName: TABLE,
        Item: {
          id: `LOCK#${dateKey}`,
          acquiredAt: nowIso(),
        },
        ConditionExpression: 'attribute_not_exists(id)',
      }),
    );
    return true;
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') return false;
    throw err;
  }
}

module.exports = {
  allocateNextIssueNumber,
  tryAcquireDailyLock,
};
