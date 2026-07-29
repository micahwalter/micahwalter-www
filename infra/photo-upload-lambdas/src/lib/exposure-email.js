/**
 * Build Exposure (photo snack) email HTML/text bodies.
 * Shared by owner test-send (U1) and scheduled production send (U3).
 */

const SITE_URL = (process.env.SITE_URL || 'https://www.micahwalter.com').replace(/\/$/, '');

function photoFilenameStem(photo) {
  const key = photo.coverImageKey || '';
  const base = key.split('/').pop() || 'photo';
  return base.replace(/\.(jpe?g|png|webp)$/i, '');
}

function photoPageUrl(photo) {
  return `${SITE_URL}/photos/${encodeURIComponent(String(photo.id))}`;
}

function photoImageUrl(photo) {
  const folder = photo.folderName;
  const stem = photoFilenameStem(photo);
  if (!folder) {
    return `${SITE_URL}/photos/${encodeURIComponent(String(photo.id))}`;
  }
  return `${SITE_URL}/images/posts/${folder}/${stem}-1200.jpg`;
}

/**
 * @param {object} photo - DynamoDB photo or public-shaped photo
 * @param {object} [opts]
 * @param {number|null} [opts.issueNumber] - set for production; omit/null for test
 * @param {boolean} [opts.isTest]
 * @returns {{ subject: string, title: string, htmlBody: string, textBody: string, viewInBrowserUrl: string, slug: string }}
 */
function buildExposureEmail(photo, opts = {}) {
  const isTest = !!opts.isTest;
  const issueNumber = opts.issueNumber != null ? Number(opts.issueNumber) : null;
  const title = (photo.title || 'Untitled').trim() || 'Untitled';
  const caption = (photo.caption || '').trim();
  const pageUrl = photoPageUrl(photo);
  const imageUrl = photoImageUrl(photo);

  let subject;
  if (isTest) {
    subject = `Test · Exposure · ${title}`;
  } else if (issueNumber != null && !Number.isNaN(issueNumber)) {
    subject = `Exposure #${issueNumber} · ${title}`;
  } else {
    subject = `Exposure · ${title}`;
  }

  const viewInBrowserUrl =
    issueNumber != null && !Number.isNaN(issueNumber)
      ? `${SITE_URL}/exposures/${issueNumber}`
      : pageUrl;

  const slug =
    issueNumber != null && !Number.isNaN(issueNumber)
      ? `exposure-${issueNumber}`
      : `exposure-test-${photo.id}`;

  const captionHtml = caption
    ? `<p style="margin:16px 0 0;font-size:16px;line-height:1.5;color:#5F5F5F;">${escapeHtml(caption)}</p>`
    : '';
  const captionText = caption ? `\n\n${caption}` : '';

  const htmlBody = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:24px;background:#fafaf2;font-family:Georgia,'Times New Roman',serif;color:#191919;">
  <div style="max-width:560px;margin:0 auto;">
    <p style="margin:0 0 16px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#5F5F5F;">
      ${isTest ? 'Exposure (test)' : issueNumber != null ? `Exposure #${issueNumber}` : 'Exposure'}
    </p>
    <a href="${escapeHtml(pageUrl)}" style="text-decoration:none;color:#191919;">
      <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title)}" width="560" style="display:block;width:100%;max-width:560px;height:auto;border:0;" />
      <h1 style="margin:20px 0 0;font-size:28px;font-weight:normal;line-height:1.2;">${escapeHtml(title)}</h1>
    </a>
    ${captionHtml}
    <p style="margin:24px 0 0;font-size:14px;">
      <a href="${escapeHtml(pageUrl)}" style="color:#191919;">View on site</a>
    </p>
  </div>
</body>
</html>`;

  const textBody = `${isTest ? 'Exposure (test)' : issueNumber != null ? `Exposure #${issueNumber}` : 'Exposure'}

${title}${captionText}

${pageUrl}
`;

  return {
    subject,
    title,
    htmlBody,
    textBody,
    viewInBrowserUrl,
    slug,
  };
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = {
  buildExposureEmail,
  photoPageUrl,
  photoImageUrl,
  SITE_URL,
};
