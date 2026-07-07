/**
 * Allocate the next post ID from the ticket server API.
 *
 *   POST /tickets/auth  { passcode } -> { token, expiresIn }
 *   POST /tickets/next  Authorization: Bearer <token> -> { id }
 *
 * Passcode: TICKETS_PASSCODE env, or ~/.config/blog/credentials.json, or interactive prompt.
 */

const readline = require('readline');
const { getTicketsPasscode, saveTicketsPasscode } = require('./tickets-credentials');

const DEFAULT_API_URL = 'https://api.micahwalter.com/tickets';

let cachedToken = null;
let cachedTokenExpiry = 0;

function apiBaseUrl() {
  const base = (process.env.TICKETS_API_URL || DEFAULT_API_URL).replace(/\/$/, '');
  return base;
}

function promptHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function resolvePasscode() {
  const fromEnvOrFile = getTicketsPasscode();
  if (fromEnvOrFile) return fromEnvOrFile;

  if (!process.stdin.isTTY) {
    throw new Error(
      'Ticket passcode required. Set TICKETS_PASSCODE or run interactively to save ~/.config/blog/credentials.json'
    );
  }

  const passcode = await promptHidden('Ticket server passcode: ');
  if (!passcode) {
    throw new Error('Passcode is required');
  }
  saveTicketsPasscode(passcode);
  console.log('Passcode saved to ~/.config/blog/credentials.json');
  return passcode;
}

async function fetchToken(passcode) {
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

  const ttl = typeof body.expiresIn === 'number' ? body.expiresIn : 1800;
  cachedToken = body.token;
  cachedTokenExpiry = Date.now() + (ttl - 60) * 1000;
  return body.token;
}

async function getToken() {
  if (cachedToken && Date.now() < cachedTokenExpiry) {
    return cachedToken;
  }
  const passcode = await resolvePasscode();
  return fetchToken(passcode);
}

/**
 * Allocate and return the next sequential post ID.
 * @returns {Promise<number>}
 */
async function allocatePostId() {
  const token = await getToken();
  const res = await fetch(`${apiBaseUrl()}/next`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const body = await res.json().catch(() => ({}));
  if (res.status === 401 && cachedToken) {
    cachedToken = null;
    cachedTokenExpiry = 0;
    return allocatePostId();
  }
  if (!res.ok) {
    throw new Error(body.message || `Ticket allocation failed (${res.status})`);
  }
  if (typeof body.id !== 'number') {
    throw new Error('Ticket response missing id');
  }
  return body.id;
}

module.exports = { allocatePostId, apiBaseUrl };
