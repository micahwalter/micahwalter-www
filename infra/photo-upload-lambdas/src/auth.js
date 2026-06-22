/**
 * POST /photos/auth
 *
 * Exchanges the shared upload passcode for a short-lived, HMAC-signed session
 * token. The token is then required by /photos/upload-url. No session is
 * stored server-side; the signature and embedded expiry are the proof.
 */

const { getSecret } = require('./lib/secrets');
const { sign, safeEqual } = require('./lib/token');

const TOKEN_TTL = parseInt(process.env.TOKEN_TTL || '1800', 10); // 30 minutes

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

exports.handler = async (event) => {
  let passcode;
  try {
    ({ passcode } = JSON.parse(event.body || '{}'));
  } catch {
    return json(400, { message: 'Invalid request body' });
  }

  if (!passcode) return json(400, { message: 'Passcode is required' });

  const secret = await getSecret();
  if (!safeEqual(passcode, secret.passcode)) {
    // Slow down brute-force attempts. This is a per-request delay only; the
    // hard rate limit is enforced by API Gateway throttling on the /auth route
    // (see infra/photo-upload.yml). A strong passcode remains the real control.
    await new Promise((r) => setTimeout(r, 1000));
    return json(401, { message: 'Incorrect passcode' });
  }

  const token = sign(secret.hmac, TOKEN_TTL);
  return json(200, { token, expiresIn: TOKEN_TTL });
};
