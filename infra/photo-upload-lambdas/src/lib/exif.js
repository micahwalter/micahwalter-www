/**
 * EXIF extraction — ported from scripts/import-photos.js but operating on an
 * in-memory Buffer rather than a file path, so it can run in Lambda against a
 * freshly-downloaded S3 object.
 */

const ExifReader = require('exifreader');
const sharp = require('sharp');

function dmsToDecimal(dms, ref) {
  if (!dms) return null;
  let degrees;
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
    const n = parseFloat(dms);
    if (Number.isNaN(n)) return null;
    degrees = n;
  } else {
    return null;
  }
  const r = String(ref || '').toUpperCase();
  if (r === 'S' || r === 'W') degrees = -Math.abs(degrees);
  return degrees;
}

/**
 * Extract precise GPS from ExifReader tags.
 */
function extractGpsFromTags(tags) {
  try {
    const latTag = tags.GPSLatitude;
    const lonTag = tags.GPSLongitude;
    if (!latTag || !lonTag) return { latitude: null, longitude: null };

    let latitude;
    let longitude;

    if (latTag.description != null && !Number.isNaN(parseFloat(latTag.description))) {
      latitude = parseFloat(latTag.description);
      const latRef = tags.GPSLatitudeRef?.value?.[0] || tags.GPSLatitudeRef?.description;
      if (String(latRef).toUpperCase().startsWith('S') && latitude > 0) latitude = -latitude;
    } else {
      latitude = dmsToDecimal(
        latTag.value,
        tags.GPSLatitudeRef?.value?.[0] || tags.GPSLatitudeRef?.description,
      );
    }

    if (lonTag.description != null && !Number.isNaN(parseFloat(lonTag.description))) {
      longitude = parseFloat(lonTag.description);
      const lonRef = tags.GPSLongitudeRef?.value?.[0] || tags.GPSLongitudeRef?.description;
      if (String(lonRef).toUpperCase().startsWith('W') && longitude > 0) longitude = -longitude;
    } else {
      longitude = dmsToDecimal(
        lonTag.value,
        tags.GPSLongitudeRef?.value?.[0] || tags.GPSLongitudeRef?.description,
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

async function extractGps(buffer) {
  try {
    const tags = ExifReader.load(buffer);
    return extractGpsFromTags(tags);
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

module.exports = { extractExif, extractGps, extractGpsFromTags, dmsToDecimal };
