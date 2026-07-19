/**
 * Unit tests for GPS hemisphere parsing (issue #117).
 * Run: node --test src/lib/exif.test.js
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  extractGpsFromTags,
  hemisphereFromString,
  parseDecimalCoord,
  applyHemisphere,
  dmsToDecimal,
} = require('./exif');

describe('hemisphereFromString', () => {
  it('reads trailing letter from Apple XMP-style decimals', () => {
    assert.equal(hemisphereFromString('73.655W'), 'W');
    assert.equal(hemisphereFromString('40.863N'), 'N');
    assert.equal(hemisphereFromString('73.655 W'), 'W');
  });

  it('reads word forms from ExifReader ref descriptions', () => {
    assert.equal(hemisphereFromString('West longitude'), 'W');
    assert.equal(hemisphereFromString('East longitude'), 'E');
    assert.equal(hemisphereFromString('North latitude'), 'N');
    assert.equal(hemisphereFromString('South latitude'), 'S');
  });
});

describe('parseDecimalCoord + applyHemisphere', () => {
  it('negates west longitude embedded in description without a ref tag', () => {
    const parsed = parseDecimalCoord('73.655W');
    assert.equal(parsed.degrees, 73.655);
    assert.equal(parsed.hemi, 'W');
    assert.equal(applyHemisphere(parsed.degrees, parsed.hemi, 'W'), -73.655);
  });
});

describe('extractGpsFromTags', () => {
  it('applies West from GPSLongitudeRef.value', () => {
    const gps = extractGpsFromTags({
      GPSLatitude: { description: '40.863' },
      GPSLatitudeRef: { value: ['N'], description: 'North latitude' },
      GPSLongitude: { description: '73.655' },
      GPSLongitudeRef: { value: ['W'], description: 'West longitude' },
    });
    assert.equal(gps.latitude, 40.863);
    assert.equal(gps.longitude, -73.655);
  });

  it('applies West from description when ref tag is missing (XMP-only)', () => {
    // Reproduces issue #117: parseFloat("73.655W") is positive and ref is absent.
    const gps = extractGpsFromTags({
      GPSLatitude: { description: '40.863N' },
      GPSLongitude: { description: '73.655W' },
    });
    assert.equal(gps.latitude, 40.863);
    assert.equal(gps.longitude, -73.655);
  });

  it('does not flip an already-negative longitude', () => {
    const gps = extractGpsFromTags({
      GPSLatitude: { description: '40.829' },
      GPSLatitudeRef: { value: ['N'], description: 'North latitude' },
      GPSLongitude: { description: '-73.655' },
      GPSLongitudeRef: { value: ['W'], description: 'West longitude' },
    });
    assert.equal(gps.longitude, -73.655);
  });

  it('keeps eastern longitudes positive', () => {
    const gps = extractGpsFromTags({
      GPSLatitude: { description: '40.5' },
      GPSLatitudeRef: { value: ['N'], description: 'North latitude' },
      GPSLongitude: { description: '72.8' },
      GPSLongitudeRef: { value: ['E'], description: 'East longitude' },
    });
    assert.equal(gps.longitude, 72.8);
  });
});

describe('dmsToDecimal', () => {
  it('handles rational arrays with W ref', () => {
    const lon = dmsToDecimal(
      [[73, 1], [39, 1], [18, 1]],
      'W',
    );
    assert.ok(Math.abs(lon - (-73.655)) < 0.001);
  });
});
