/**
 * EXIF extraction — ported from scripts/import-photos.js but operating on an
 * in-memory Buffer rather than a file path, so it can run in Lambda against a
 * freshly-downloaded S3 object.
 */

const ExifReader = require('exifreader');
const sharp = require('sharp');

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

module.exports = { extractExif };
