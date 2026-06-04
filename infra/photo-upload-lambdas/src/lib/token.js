/**
 * Stateless session tokens for the upload form.
 *
 * A token is `<payload>.<signature>` where payload is base64url-encoded JSON
 * `{ exp }` and signature is an HMAC-SHA256 of the payload using the shared
 * key from Secrets Manager. There is no server-side session store — validity
 * is proven entirely by the signature and the embedded expiry.
 */

const crypto = require('crypto');

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function sign(key, ttlSeconds) {
  const payload = b64url(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + ttlSeconds }));
  const sig = b64url(crypto.createHmac('sha256', key).update(payload).digest());
  return `${payload}.${sig}`;
}

function verify(key, token) {
  if (typeof token !== 'string' || !token.includes('.')) return false;

  const [payload, sig] = token.split('.');
  const expected = b64url(crypto.createHmac('sha256', key).update(payload).digest());

  // Constant-time comparison to avoid leaking the signature byte-by-byte.
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;

  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
    return typeof exp === 'number' && exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

/** Constant-time string equality for the passcode check. */
function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

module.exports = { sign, verify, safeEqual };
