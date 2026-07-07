/**
 * Secrets Manager helper.
 *
 * Loads and caches the photo-upload secret, a JSON document of the form:
 *   { "passcode": "<the upload passcode>",
 *     "hmac":     "<random key used to sign session tokens>",
 *     "githubToken": "<fine-grained PAT with contents:write on the repo>",
 *     "ticketsPasscode": "<passcode for ticket server API>" }
 *
 * The value is cached in module scope for the lifetime of a warm Lambda
 * container so we only hit Secrets Manager on a cold start.
 */

const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const client = new SecretsManagerClient({});
let cached = null;

async function getSecret() {
  if (cached) return cached;

  const arn = process.env.SECRET_ARN;
  if (!arn) throw new Error('SECRET_ARN env var is not set');

  const res = await client.send(new GetSecretValueCommand({ SecretId: arn }));
  cached = JSON.parse(res.SecretString);
  return cached;
}

module.exports = { getSecret };
