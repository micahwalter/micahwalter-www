/**
 * Unit tests for public GPS fuzzing (neighborhood-scale privacy).
 * Run: node --test src/lib/geo.test.js
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  PUBLIC_COORD_DECIMALS,
  roundCoord,
  fuzzPublicCoords,
  placeTag,
} = require('./geo');

describe('PUBLIC_COORD_DECIMALS', () => {
  it('is 2 for neighborhood-scale (~1.1 km) privacy', () => {
    assert.equal(PUBLIC_COORD_DECIMALS, 2);
  });
});

describe('roundCoord', () => {
  it('returns null for null/NaN', () => {
    assert.equal(roundCoord(null), null);
    assert.equal(roundCoord(undefined), null);
    assert.equal(roundCoord(Number.NaN), null);
  });

  it('rounds to 2 decimal places by default', () => {
    assert.equal(roundCoord(40.86347), 40.86);
    assert.equal(roundCoord(-73.65589), -73.66);
  });
});

describe('fuzzPublicCoords', () => {
  it('returns nulls when either coordinate is missing', () => {
    assert.deepEqual(fuzzPublicCoords(null, -73.65), {
      publicLatitude: null,
      publicLongitude: null,
    });
    assert.deepEqual(fuzzPublicCoords(40.86, null), {
      publicLatitude: null,
      publicLongitude: null,
    });
  });

  it('rounds both axes to 2 decimals (collapses 3-decimal input)', () => {
    const out = fuzzPublicCoords(40.863, -73.655);
    assert.deepEqual(out, {
      publicLatitude: 40.86,
      publicLongitude: -73.65,
    });
  });

  it('is idempotent for already-fuzzed coords', () => {
    const once = fuzzPublicCoords(40.86347, -73.65589);
    const twice = fuzzPublicCoords(once.publicLatitude, once.publicLongitude);
    assert.deepEqual(once, twice);
  });
});

describe('placeTag', () => {
  it('slugifies place labels', () => {
    assert.equal(placeTag('Port Washington'), 'port-washington');
  });
});
