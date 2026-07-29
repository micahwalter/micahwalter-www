/**
 * Emit NewsletterSendRequested onto the newsletter EventBridge bus.
 */

const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');
const { randomUUID } = require('crypto');

const BUS = process.env.NEWSLETTER_EVENT_BUS_NAME || 'newsletter-bus';
const SOURCE = 'newsletter.campaigns';
const DETAIL_TYPE = 'NewsletterSendRequested';

const eb = new EventBridgeClient({});

/**
 * @param {object} fields
 * @param {number} fields.emailId
 * @param {string} fields.slug
 * @param {string} fields.title
 * @param {string} fields.htmlBody
 * @param {string} fields.textBody
 * @param {string} fields.viewInBrowserUrl
 * @param {string} [fields.testEmail]
 */
async function emitNewsletterSendRequested(fields) {
  const detail = {
    eventId: randomUUID(),
    occurredAt: new Date().toISOString(),
    version: '1',
    emailId: fields.emailId,
    slug: fields.slug,
    title: fields.title,
    htmlBody: fields.htmlBody,
    textBody: fields.textBody,
    viewInBrowserUrl: fields.viewInBrowserUrl,
  };
  if (fields.testEmail) {
    detail.testEmail = fields.testEmail;
  }

  const res = await eb.send(
    new PutEventsCommand({
      Entries: [
        {
          EventBusName: BUS,
          Source: SOURCE,
          DetailType: DETAIL_TYPE,
          Detail: JSON.stringify(detail),
        },
      ],
    }),
  );

  const failed = res.FailedEntryCount || 0;
  if (failed > 0) {
    const msg = res.Entries?.[0]?.ErrorMessage || 'PutEvents failed';
    throw new Error(`emitNewsletterSendRequested: ${msg}`);
  }
  return detail;
}

module.exports = { emitNewsletterSendRequested };
