/**
 * Sunday Exposure orchestrator — EventBridge Scheduler target.
 *
 * Flow: daily lock → candidates → empty notify OR allocate/create/emit/stamp.
 */

const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { listExposureCandidates, stampExposureSent } = require('./lib/photos-db');
const { allocateNextIssueNumber, tryAcquireDailyLock } = require('./lib/exposure-counter');
const { createExposure } = require('./lib/exposures-db');
const { writeExposureOg } = require('./lib/og-html');
const { buildExposureEmail } = require('./lib/exposure-email');
const { emitNewsletterSendRequested } = require('./lib/newsletter-events');

const ses = new SESClient({});
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim();
const SES_FROM = (process.env.SES_FROM_ADDRESS || ADMIN_EMAIL || '').trim();

function nyDateKey(d = new Date()) {
  // en-CA → YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

function pickRandom(items) {
  if (!items.length) return null;
  return items[Math.floor(Math.random() * items.length)];
}

async function notifyEmptyPool() {
  if (!ADMIN_EMAIL || !SES_FROM) {
    console.error('empty-pool: ADMIN_EMAIL / SES_FROM_ADDRESS not configured');
    return;
  }
  await ses.send(
    new SendEmailCommand({
      Source: SES_FROM,
      Destination: { ToAddresses: [ADMIN_EMAIL] },
      Message: {
        Subject: { Data: 'Exposure: no eligible photos this week', Charset: 'UTF-8' },
        Body: {
          Text: {
            Charset: 'UTF-8',
            Data:
              'The Sunday Exposure scheduler ran but found no public photos marked eligible that have not already been sent.\n\nMark more photos Eligible for Exposure in /upload when you are ready.',
          },
        },
      },
    }),
  );
  console.log(JSON.stringify({ msg: 'exposure-empty-pool-notified' }));
}

exports.handler = async (event) => {
  console.log(JSON.stringify({ msg: 'exposure-orchestrator-start', eventType: typeof event }));

  const dateKey = nyDateKey();
  const locked = await tryAcquireDailyLock(dateKey);
  if (!locked) {
    console.log(JSON.stringify({ msg: 'exposure-orchestrator-skip-locked', dateKey }));
    return { ok: true, skipped: 'already-ran', dateKey };
  }

  const candidates = await listExposureCandidates({ maxItems: 100 });
  if (!candidates.length) {
    await notifyEmptyPool();
    return { ok: true, empty: true, dateKey };
  }

  const photo = pickRandom(candidates);
  const issueNumber = await allocateNextIssueNumber();
  const sentAt = new Date().toISOString();
  const built = buildExposureEmail(photo, { issueNumber, isTest: false });

  await createExposure({
    issueNumber,
    photoId: photo.id,
    title: photo.title,
    caption: photo.caption || '',
    folderName: photo.folderName,
    coverImageKey: photo.coverImageKey,
    sentAt,
  });

  try {
    await writeExposureOg({
      issueNumber,
      title: photo.title,
      caption: photo.caption || '',
      folderName: photo.folderName,
      coverImageKey: photo.coverImageKey,
    });
  } catch (err) {
    console.warn(`OG HTML write failed for Exposure ${issueNumber}: ${err.message}`);
  }

  await emitNewsletterSendRequested({
    emailId: issueNumber,
    slug: built.slug,
    title: built.subject,
    htmlBody: built.htmlBody,
    textBody: built.textBody,
    viewInBrowserUrl: built.viewInBrowserUrl,
  });

  try {
    await stampExposureSent(photo.id, { sentAt, issueNumber });
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      console.warn(
        JSON.stringify({
          msg: 'exposure-stamp-skipped-already-sent',
          photoId: String(photo.id),
          issueNumber,
        }),
      );
    } else {
      throw err;
    }
  }

  console.log(
    JSON.stringify({
      msg: 'exposure-orchestrator-sent',
      photoId: String(photo.id),
      issueNumber,
      dateKey,
    }),
  );

  return { ok: true, issueNumber, photoId: String(photo.id), dateKey };
};
