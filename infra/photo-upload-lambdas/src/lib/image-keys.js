/**
 * Resolve S3 keys for enrichment — original for GPS, optimized cover for Bedrock.
 */

function folderPrefix(photo) {
  if (photo.folderName) return `images/posts/${photo.folderName}`;
  if (photo.coverImageKey) {
    const parts = photo.coverImageKey.split('/');
    parts.pop();
    return parts.join('/');
  }
  return null;
}

/**
 * Candidate keys for Bedrock (prefer 1200 JPEG then WebP).
 */
function bedrockCoverCandidates(photo) {
  const prefix = folderPrefix(photo);
  const keys = [];
  if (prefix) {
    keys.push(`${prefix}/photo-1200.jpg`);
    keys.push(`${prefix}/photo-1200.webp`);
  }
  if (photo.coverImageKey) keys.push(photo.coverImageKey);
  return [...new Set(keys)];
}

function originalKey(photo) {
  if (photo.originalKey) return photo.originalKey;
  const prefix = folderPrefix(photo);
  if (!prefix) return null;
  // Prefer jpg under originals; process stores photo{ext}
  return `images/originals/posts/${photo.folderName}/photo.jpg`;
}

module.exports = {
  folderPrefix,
  bedrockCoverCandidates,
  originalKey,
};
