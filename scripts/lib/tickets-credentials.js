/**
 * Read/write ticket server credentials in ~/.config/blog/credentials.json
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const CREDENTIALS_DIR = path.join(os.homedir(), '.config', 'blog');
const CREDENTIALS_FILE = path.join(CREDENTIALS_DIR, 'credentials.json');

function readCredentials() {
  if (!fs.existsSync(CREDENTIALS_FILE)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function writeCredentials(data) {
  fs.mkdirSync(CREDENTIALS_DIR, { recursive: true, mode: 0o700 });
  const merged = { ...readCredentials(), ...data };
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(merged, null, 2) + '\n', { mode: 0o600 });
}

function getTicketsPasscode() {
  if (process.env.TICKETS_PASSCODE) {
    return process.env.TICKETS_PASSCODE.trim();
  }
  const creds = readCredentials();
  return creds.ticketsPasscode ? String(creds.ticketsPasscode).trim() : '';
}

function saveTicketsPasscode(passcode) {
  writeCredentials({ ticketsPasscode: passcode });
}

module.exports = {
  CREDENTIALS_FILE,
  getTicketsPasscode,
  saveTicketsPasscode,
};
