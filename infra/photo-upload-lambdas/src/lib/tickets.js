/**
 * HTTP client for the ticket server API (used by photo-upload Lambda).
 */

const DEFAULT_API_URL = 'https://api.micahwalter.com/tickets';

function apiBaseUrl() {
  return (process.env.TICKETS_API_URL || DEFAULT_API_URL).replace(/\/$/, '');
}

/**
 * @param {string} passcode
 * @returns {Promise<string>} session token
 */
async function auth(passcode) {
  const res = await fetch(`${apiBaseUrl()}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passcode }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.message || `Ticket auth failed (${res.status})`);
  }
  if (!body.token) {
    throw new Error('Ticket auth response missing token');
  }
  return body.token;
}

/**
 * @param {string} token
 * @returns {Promise<number>}
 */
async function next(token) {
  const res = await fetch(`${apiBaseUrl()}/next`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.message || `Ticket next failed (${res.status})`);
  }
  if (typeof body.id !== 'number') {
    throw new Error('Ticket response missing id');
  }
  return body.id;
}

/**
 * @param {string} passcode
 * @returns {Promise<number>}
 */
async function allocatePostId(passcode) {
  const token = await auth(passcode);
  return next(token);
}

module.exports = { allocatePostId, auth, next, apiBaseUrl };
