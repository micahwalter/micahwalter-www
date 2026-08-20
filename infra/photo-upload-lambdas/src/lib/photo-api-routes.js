/**
 * Route matchers for photos-api. Kept free of AWS clients so tests can require
 * this module without DynamoDB/Secrets setup.
 */

function isExposureQueueRoute(routeKey, method, path) {
  if (routeKey === 'GET /exposure-queue' || routeKey === 'GET /photos/exposure-queue') {
    return true;
  }
  return method === 'GET' && (path === '/exposure-queue' || path === '/exposure-queue/');
}

function isReservedPhotoId(id) {
  return (
    !id ||
    id === 'featured' ||
    id === 'galleries' ||
    id === 'exposure-queue'
  );
}

module.exports = {
  isExposureQueueRoute,
  isReservedPhotoId,
};
