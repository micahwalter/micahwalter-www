/**
 * Geo helpers — fuzz public coords and slugify place tags.
 */

function roundCoord(value, decimals = 3) {
  if (value == null || Number.isNaN(Number(value))) return null;
  const n = Number(value);
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

function fuzzPublicCoords(latitude, longitude) {
  if (latitude == null || longitude == null) {
    return { publicLatitude: null, publicLongitude: null };
  }
  return {
    publicLatitude: roundCoord(latitude, 3),
    publicLongitude: roundCoord(longitude, 3),
  };
}

/**
 * Lowercase hyphenated tag from a place label.
 */
function placeTag(label) {
  if (!label) return null;
  const s = String(label)
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!s || s.length > 40) return null;
  return s;
}

module.exports = {
  roundCoord,
  fuzzPublicCoords,
  placeTag,
};
