/**
 * Unit tests for Bedrock tag response parsing (issue #153).
 * Run: node --test src/lib/bedrock-tags.test.js
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { parseTagResponse, imageFormat } = require('./bedrock-tags');

describe('parseTagResponse', () => {
  it('parses comma-separated tags', () => {
    assert.deepEqual(
      parseTagResponse('street-photography, urban, night, city-lights'),
      ['street-photography', 'urban', 'night', 'city-lights'],
    );
  });

  it('parses newline and bullet lists', () => {
    assert.deepEqual(
      parseTagResponse('- beach\n- toddler\n• summer'),
      ['beach', 'toddler', 'summer'],
    );
  });

  it('strips Tags: prefix and numbered items', () => {
    assert.deepEqual(
      parseTagResponse('Tags: 1) candid, 2) golden-hour, reflection'),
      ['candid', 'golden-hour', 'reflection'],
    );
  });

  it('returns empty for blank input', () => {
    assert.deepEqual(parseTagResponse(''), []);
    assert.deepEqual(parseTagResponse('   '), []);
  });

  it('drops overlong tokens', () => {
    const long = 'a'.repeat(35);
    assert.deepEqual(parseTagResponse(`ok, ${long}, fine`), ['ok', 'fine']);
  });
});

describe('imageFormat', () => {
  it('detects from content type and key', () => {
    assert.equal(imageFormat('image/png', 'x.jpg'), 'png');
    assert.equal(imageFormat('', 'photo-1200.webp'), 'webp');
    assert.equal(imageFormat('image/jpeg', 'photo.jpg'), 'jpeg');
  });
});
