const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { isShareCrawler, rewriteShareCrawler } = require('./share-crawler');

describe('share-crawler', () => {
  it('detects LinkedIn, Twitter, Slack, and Google bots', () => {
    assert.equal(isShareCrawler('LinkedInBot/1.0'), true);
    assert.equal(isShareCrawler('Twitterbot/1.0'), true);
    assert.equal(isShareCrawler('Slackbot-LinkExpanding 1.0'), true);
    assert.equal(isShareCrawler('facebookexternalhit/1.1'), true);
    assert.equal(isShareCrawler('Googlebot/2.1'), true);
    assert.equal(isShareCrawler('Mozilla/5.0 (Macintosh) Chrome/120'), false);
  });

  it('rewrites API-backed paths to OG HTML objects', () => {
    assert.equal(rewriteShareCrawler('/'), '/og/home.html');
    assert.equal(rewriteShareCrawler('/exposures'), '/og/exposures.html');
    assert.equal(rewriteShareCrawler('/photos'), '/og/photos.html');
    assert.equal(rewriteShareCrawler('/galleries'), '/og/galleries.html');
    assert.equal(rewriteShareCrawler('/photos/178'), '/og/photos/178.html');
    assert.equal(rewriteShareCrawler('/exposures/12'), '/og/exposures/12.html');
    assert.equal(rewriteShareCrawler('/galleries/coast'), '/og/galleries/coast.html');
    assert.equal(rewriteShareCrawler('/posts/hello'), null);
    assert.equal(rewriteShareCrawler('/about'), null);
  });
});
