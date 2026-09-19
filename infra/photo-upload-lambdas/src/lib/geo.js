/**
 * Geo helpers — fuzz public coords and slugify place tags.
 */

/** Neighborhood-scale rounding (~1.1 km at equator). */
const PUBLIC_COORD_DECIMALS = 2;

function roundCoord(value, decimals = PUBLIC_COORD_DECIMALS) {
  if (value == null || Number.isNaN(Number(value))) return null;
  const n = Number(value);
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

/**
 * Public map coordinates — neighborhood scale (~1.1 km), not street-level.
 * Precise GPS stays in private latitude/longitude fields only.
 */
function fuzzPublicCoords(latitude, longitude) {
  if (latitude == null || longitude == null) {
    return { publicLatitude: null, publicLongitude: null };
  }
  return {
    publicLatitude: roundCoord(latitude, PUBLIC_COORD_DECIMALS),
    publicLongitude: roundCoord(longitude, PUBLIC_COORD_DECIMALS),
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
  PUBLIC_COORD_DECIMALS,
  roundCoord,
  fuzzPublicCoords,
  placeTag,
};
