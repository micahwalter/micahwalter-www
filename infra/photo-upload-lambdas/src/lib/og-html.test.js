const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  escapeHtml,
  filenameStem,
  photoOgImage,
  htmlForPhoto,
  htmlForExposure,
  htmlForGallery,
  htmlForIndex,
  ogKeyForPhoto,
} = require('./og-html');

describe('og-html', () => {
  it('escapes HTML in titles and descriptions', () => {
    assert.equal(escapeHtml('A & B <c> "q"'), 'A &amp; B &lt;c&gt; &quot;q&quot;');
  });

  it('derives the 1200px photo URL from folder and cover key', () => {
    process.env.SITE_URL = 'https://www.micahwalter.com';
    const url = photoOgImage({
      folderName: '2026-08-01-campfire',
      coverImageKey: 'images/posts/2026-08-01-campfire/photo.jpg',
    });
    assert.equal(
      url,
      'https://www.micahwalter.com/images/posts/2026-08-01-campfire/photo-1200.jpg',
    );
    assert.equal(filenameStem('images/posts/x/photo.jpg'), 'photo');
  });

  it('falls back to the site share card when folder is missing', () => {
    process.env.SITE_URL = 'https://www.micahwalter.com';
    assert.equal(photoOgImage({}), 'https://www.micahwalter.com/share-card.jpg');
  });

  it('builds photo OG HTML with large-image twitter card and canonical URL', () => {
    process.env.SITE_URL = 'https://www.micahwalter.com';
    const html = htmlForPhoto({
      id: 178,
      title: 'Campfire',
      caption: 'Dusk by the lake',
      folderName: '2026-08-01-campfire',
      coverImageKey: 'images/posts/2026-08-01-campfire/photo.jpg',
    });
    assert.match(html, /og:image" content="https:\/\/www\.micahwalter\.com\/images\/posts\/2026-08-01-campfire\/photo-1200\.jpg"/);
    assert.match(html, /twitter:card" content="summary_large_image"/);
    assert.match(html, /canonical" href="https:\/\/www\.micahwalter\.com\/photos\/178"/);
    assert.match(html, /<title>Campfire<\/title>/);
    assert.equal(ogKeyForPhoto(178), 'og/photos/178.html');
  });

  it('builds Exposure OG HTML with issue number in the title', () => {
    process.env.SITE_URL = 'https://www.micahwalter.com';
    const html = htmlForExposure({
      issueNumber: 12,
      title: 'Campfire',
      caption: 'A few words',
      folderName: '2026-08-01-campfire',
      coverImageKey: 'images/posts/2026-08-01-campfire/photo.jpg',
    });
    assert.match(html, /Exposure No\. 12 · Campfire/);
    assert.match(html, /\/exposures\/12"/);
  });

  it('builds gallery OG HTML from the cover photo when present', () => {
    process.env.SITE_URL = 'https://www.micahwalter.com';
    const html = htmlForGallery(
      { slug: 'coast', title: 'Coast', description: 'West' },
      { folderName: '2026-01-01-wave', coverImageKey: 'images/posts/2026-01-01-wave/photo.jpg' },
    );
    assert.match(html, /\/galleries\/coast"/);
    assert.match(html, /2026-01-01-wave\/photo-1200\.jpg/);
  });

  it('builds index OG HTML', () => {
    process.env.SITE_URL = 'https://www.micahwalter.com';
    const html = htmlForIndex({
      title: 'Exposures',
      description: 'A periodic photo newsletter',
      path: '/exposures',
      image: 'https://www.micahwalter.com/images/posts/x/photo-1200.jpg',
    });
    assert.match(html, /og:url" content="https:\/\/www\.micahwalter\.com\/exposures"/);
    assert.match(html, /photo-1200\.jpg/);
  });
});
