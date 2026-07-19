/**
 * EXIF extraction — ported from scripts/import-photos.js but operating on an
 * in-memory Buffer rather than a file path, so it can run in Lambda against a
 * freshly-downloaded S3 object.
 */

const ExifReader = require('exifreader');
const sharp = require('sharp');

/**
 * Pull N/S/E/W from a ref tag or from a coordinate string that embeds it
 * (Apple XMP often uses "73,39.3W" → description "73.655W").
 */
function hemisphereFromRef(refTag) {
  if (refTag == null) return null;
  const candidates = [];
  if (refTag.value != null) {
    if (Array.isArray(refTag.value)) {
      candidates.push(refTag.value.join(''));
      candidates.push(...refTag.value);
    } else {
      candidates.push(refTag.value);
    }
  }
  if (refTag.description != null) candidates.push(refTag.description);

  for (const c of candidates) {
    const letter = hemisphereFromString(c);
    if (letter) return letter;
  }
  return null;
}

function hemisphereFromString(raw) {
  if (raw == null) return null;
  const s = String(raw).trim().toUpperCase();
  if (!s) return null;
  // Word forms first — "West longitude" must not match trailing E in "longitude".
  if (/\bNORTH\b/.test(s) || s === 'N') return 'N';
  if (/\bSOUTH\b/.test(s) || s === 'S') return 'S';
  if (/\bEAST\b/.test(s) || s === 'E') return 'E';
  if (/\bWEST\b/.test(s) || s === 'W') return 'W';
  // Trailing hemisphere after a coordinate (e.g. "73.655W", "40.8 S")
  const trailing = s.match(/[\d.]\s*([NSEW])\s*$/);
  if (trailing) return trailing[1];
  return null;
}

function applyHemisphere(degrees, hemi, negativeLetter) {
  if (degrees == null || Number.isNaN(degrees)) return null;
  if (hemi === negativeLetter) return -Math.abs(degrees);
  if (hemi && hemi !== negativeLetter) return Math.abs(degrees);
  // No hemisphere hint — keep sign if already present (signed decimal).
  return degrees;
}

function parseDecimalCoord(raw) {
  if (raw == null) return { degrees: null, hemi: null };
  if (typeof raw === 'number') {
    return { degrees: raw, hemi: null };
  }
  const s = String(raw).trim();
  const hemi = hemisphereFromString(s);
  const n = parseFloat(s);
  if (Number.isNaN(n)) return { degrees: null, hemi };
  return { degrees: n, hemi };
}

function dmsToDecimal(dms, ref) {
  if (!dms && dms !== 0) return null;
  let degrees;
  let embeddedHemi = null;
  if (typeof dms === 'number') {
    degrees = dms;
  } else if (Array.isArray(dms)) {
    const [d, m, s] = dms.map((x) => {
      if (typeof x === 'number') return x;
      if (Array.isArray(x) && x.length === 2) return x[0] / x[1];
      return Number(x);
    });
    degrees = d + (m || 0) / 60 + (s || 0) / 3600;
  } else if (typeof dms === 'string') {
    const parsed = parseDecimalCoord(dms);
    if (parsed.degrees == null) return null;
    degrees = parsed.degrees;
    embeddedHemi = parsed.hemi;
  } else {
    return null;
  }
  const hemi = hemisphereFromString(ref) || embeddedHemi;
  // Caller passes lat or lon ref; S and W both mean "negative".
  if (hemi === 'S' || hemi === 'W') return -Math.abs(degrees);
  if (hemi === 'N' || hemi === 'E') return Math.abs(degrees);
  return degrees;
}

/**
 * Extract precise GPS from ExifReader tags (flat or expanded.exif).
 */
function extractGpsFromTags(tags) {
  try {
    const latTag = tags.GPSLatitude;
    const lonTag = tags.GPSLongitude;
    if (!latTag || !lonTag) return { latitude: null, longitude: null };

    let latitude;
    let longitude;

    const latRefHemi = hemisphereFromRef(tags.GPSLatitudeRef);
    const lonRefHemi = hemisphereFromRef(tags.GPSLongitudeRef);

    if (latTag.description != null && !Number.isNaN(parseFloat(latTag.description))) {
      const parsed = parseDecimalCoord(latTag.description);
      latitude = applyHemisphere(parsed.degrees, parsed.hemi || latRefHemi, 'S');
    } else {
      latitude = dmsToDecimal(
        latTag.value,
        latRefHemi || tags.GPSLatitudeRef?.value?.[0] || tags.GPSLatitudeRef?.description,
      );
    }

    if (lonTag.description != null && !Number.isNaN(parseFloat(lonTag.description))) {
      const parsed = parseDecimalCoord(lonTag.description);
      longitude = applyHemisphere(parsed.degrees, parsed.hemi || lonRefHemi, 'W');
    } else {
      longitude = dmsToDecimal(
        lonTag.value,
        lonRefHemi || tags.GPSLongitudeRef?.value?.[0] || tags.GPSLongitudeRef?.description,
      );
    }

    if (latitude == null || longitude == null || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return { latitude: null, longitude: null };
    }
    if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      return { latitude: null, longitude: null };
    }
    return { latitude, longitude };
  } catch {
    return { latitude: null, longitude: null };
  }
}

/**
 * Prefer ExifReader's expanded gps group (signed decimals from EXIF IFD).
 * Fall back to flat/XMP tags, including Apple-style "73.655W" descriptions.
 */
async function extractGps(buffer) {
  try {
    const expanded = ExifReader.load(buffer, { expanded: true });
    const gps = expanded.gps;
    if (gps && gps.Latitude != null && gps.Longitude != null) {
      const latitude = Number(gps.Latitude);
      const longitude = Number(gps.Longitude);
      if (
        !Number.isNaN(latitude)
        && !Number.isNaN(longitude)
        && Math.abs(latitude) <= 90
        && Math.abs(longitude) <= 180
      ) {
        return { latitude, longitude };
      }
    }

    // Flat merge (XMP may overwrite EXIF) — still handles embedded N/S/E/W.
    const flat = ExifReader.load(buffer);
    return extractGpsFromTags(flat);
  } catch (err) {
    console.warn('Could not read GPS EXIF:', err.message);
    return { latitude: null, longitude: null };
  }
}

async function extractExif(buffer) {
  let exif = {};
  try {
    const tags = ExifReader.load(buffer);
    const getTagValue = (name) => {
      const tag = tags[name];
      if (!tag) return undefined;
      return tag.description || tag.value;
    };

    const make = getTagValue('Make');
    const model = getTagValue('Model');
    let camera;
    if (make && model) {
      const cleanModel = String(model).replace(make, '').trim();
      camera = `${make} ${cleanModel}`.trim();
    } else if (model) {
      camera = model;
    }

    const lens = getTagValue('LensModel') || getTagValue('LensMake');

    let aperture;
    if (tags.FNumber && tags.FNumber.description) {
      const d = tags.FNumber.description;
      aperture = d.startsWith('f/') ? d : `f/${d}`;
    } else if (tags.ApertureValue && tags.ApertureValue.description) {
      const d = tags.ApertureValue.description;
      aperture = d.startsWith('f/') ? d : `f/${d}`;
    }

    const shutterSpeed = tags.ExposureTime && tags.ExposureTime.description
      ? tags.ExposureTime.description
      : undefined;

    const isoValue = getTagValue('ISOSpeedRatings') || getTagValue('ISO');
    const iso = isoValue !== undefined ? String(isoValue) : undefined;

    const focalLength = tags.FocalLength && tags.FocalLength.description
      ? tags.FocalLength.description
      : undefined;

    let dateTaken;
    const dt = getTagValue('DateTimeOriginal') || getTagValue('DateTime');
    if (dt) {
      dateTaken = String(dt).replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
    }

    exif = { camera, lens, aperture, shutterSpeed, iso, focalLength, dateTaken };
  } catch (err) {
    console.warn('Could not read EXIF:', err.message);
  }

  try {
    const meta = await sharp(buffer).metadata();
    exif.width = meta.width;
    exif.height = meta.height;
    exif.format = meta.format;
  } catch (err) {
    console.warn('Could not read image dimensions:', err.message);
  }

  return exif;
}

module.exports = {
  extractExif,
  extractGps,
  extractGpsFromTags,
  dmsToDecimal,
  hemisphereFromString,
  hemisphereFromRef,
  parseDecimalCoord,
  applyHemisphere,
};
