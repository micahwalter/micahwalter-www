/**
 * URI rewrite for share crawlers. Keep in sync with the CloudFront Function
 * in infra/infra.yml (StaticHTMLRoutingFunction).
 */

const BOT_NEEDLES = [
  'linkedinbot',
  'twitterbot',
  'facebookexternalhit',
  'facebot',
  'slackbot',
  'discordbot',
  'whatsapp',
  'telegrambot',
  'applebot',
  'pinterest',
  'embedly',
  'redditbot',
  'skypeuripreview',
  'vkshare',
  'iframely',
  'googlebot',
  'bingbot',
  'yandex',
  'duckduckbot',
  'baiduspider',
  'slurp',
  'facebookcatalog',
  'pinterestbot',
  'opengraph',
];

function isShareCrawler(userAgent) {
  if (!userAgent) return false;
  const ua = String(userAgent).toLowerCase();
  for (let i = 0; i < BOT_NEEDLES.length; i++) {
    if (ua.indexOf(BOT_NEEDLES[i]) !== -1) return true;
  }
  return false;
}

function rewriteShareCrawler(uri) {
  let path = uri || '';
  if (path.charAt(0) === '/') path = path.slice(1);
  if (path.endsWith('/')) path = path.slice(0, -1);
  if (path === '') return '/og/home.html';
  const parts = path.split('/');
  if (parts.length === 1) {
    if (parts[0] === 'photos') return '/og/photos.html';
    if (parts[0] === 'exposures') return '/og/exposures.html';
    if (parts[0] === 'galleries') return '/og/galleries.html';
    return null;
  }
  if (parts.length !== 2) return null;
  if (parts[0] === 'photos' && /^\d+$/.test(parts[1])) {
    return `/og/photos/${parts[1]}.html`;
  }
  if (parts[0] === 'exposures' && /^\d+$/.test(parts[1])) {
    return `/og/exposures/${parts[1]}.html`;
  }
  if (parts[0] === 'galleries' && parts[1] && parts[1] !== '_placeholder') {
    return `/og/galleries/${parts[1]}.html`;
  }
  return null;
}

module.exports = { isShareCrawler, rewriteShareCrawler, BOT_NEEDLES };
