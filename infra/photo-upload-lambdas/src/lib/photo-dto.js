/**
 * Map DynamoDB Photo → public DTO (never expose precise GPS).
 */

function toPublicPhoto(photo) {
  if (!photo) return null;
  const exif = photo.exif || {};
  return {
    id: photo.id,
    title: photo.title,
    caption: photo.caption || '',
    publishedAt: photo.publishedAt,
    createdAt: photo.createdAt,
    updatedAt: photo.updatedAt,
    featured: !!photo.featured,
    exposureEligible: !!photo.exposureEligible,
    exposureSentAt: photo.exposureSentAt || null,
    exposureIssueNumber:
      photo.exposureIssueNumber != null ? Number(photo.exposureIssueNumber) : null,
    tags: photo.tags || [],
    enrichmentStatus: photo.enrichmentStatus,
    folderName: photo.folderName,
    coverImageKey: photo.coverImageKey,
    category: photo.category || 'Photography',
    exif: {
      camera: exif.camera,
      lens: exif.lens,
      aperture: exif.aperture,
      shutterSpeed: exif.shutterSpeed,
      iso: exif.iso,
      focalLength: exif.focalLength,
      dateTaken: exif.dateTaken,
      width: exif.width,
      height: exif.height,
      format: exif.format,
    },
    publicLatitude: photo.publicLatitude ?? null,
    publicLongitude: photo.publicLongitude ?? null,
    city: photo.city ?? null,
    country: photo.country ?? null,
  };
}

module.exports = { toPublicPhoto };
