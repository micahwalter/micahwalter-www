/**
 * Route matching for the Exposure queue admin endpoint (issue #141).
 * Run: node --test src/lib/photo-api-routes.test.js
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { isExposureQueueRoute, isReservedPhotoId } = require('./photo-api-routes');

describe('isExposureQueueRoute', () => {
  it('matches API Gateway route keys with and without the mapping prefix', () => {
    assert.equal(isExposureQueueRoute('GET /exposure-queue', 'GET', '/other'), true);
    assert.equal(isExposureQueueRoute('GET /photos/exposure-queue', 'GET', '/other'), true);
  });

  it('matches path fallbacks used when routeKey is empty', () => {
    assert.equal(isExposureQueueRoute('', 'GET', '/exposure-queue'), true);
    assert.equal(isExposureQueueRoute('', 'GET', '/exposure-queue/'), true);
  });

  it('does not match photo ids or other verbs', () => {
    assert.equal(isExposureQueueRoute('GET /{id}', 'GET', '/141'), false);
    assert.equal(isExposureQueueRoute('', 'GET', '/141'), false);
    assert.equal(isExposureQueueRoute('', 'POST', '/exposure-queue'), false);
    assert.equal(isExposureQueueRoute('GET /featured', 'GET', '/featured'), false);
  });
});

describe('isReservedPhotoId', () => {
  it('reserves static photo-api paths so GET /{id} cannot capture them', () => {
    assert.equal(isReservedPhotoId('exposure-queue'), true);
    assert.equal(isReservedPhotoId('featured'), true);
    assert.equal(isReservedPhotoId('galleries'), true);
    assert.equal(isReservedPhotoId(''), true);
    assert.equal(isReservedPhotoId('141'), false);
  });
});
