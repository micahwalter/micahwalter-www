/**
 * Public HTTP API for Exposure archive.
 * Mapped at api.micahwalter.com/exposures → routes relative to that key.
 */

const { getExposure, listExposures, toPublicExposure } = require('./lib/exposures-db');

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function requestPath(event) {
  const raw = event.rawPath || event.requestContext?.http?.path || '';
  return raw.replace(/^\/exposures(?=\/|$)/, '') || '/';
}

function isListRoute(routeKey, method, path) {
  if (routeKey === 'GET /' || routeKey === 'GET /exposures') return true;
  return method === 'GET' && (path === '/' || path === '');
}

function isGetRoute(routeKey, method, path) {
  if (routeKey === 'GET /{n}' || routeKey === 'GET /exposures/{n}') return true;
  return method === 'GET' && /^\/[^/]+$/.test(path);
}

exports.handler = async (event) => {
  const routeKey = event.routeKey || '';
  const method = event.requestContext?.http?.method || event.requestContext?.httpMethod || 'GET';
  const path = requestPath(event);

  if (method === 'OPTIONS') {
    return { statusCode: 204 };
  }

  try {
    if (isListRoute(routeKey, method, path)) {
      const qs = event.queryStringParameters || {};
      const page = await listExposures({ limit: qs.limit, cursor: qs.cursor });
      return json(200, {
        items: page.items.map(toPublicExposure),
        cursor: page.cursor,
        limit: page.limit,
      });
    }

    if (isGetRoute(routeKey, method, path)) {
      const n = event.pathParameters?.n || path.slice(1);
      if (!n || !/^\d+$/.test(String(n))) {
        return json(404, { message: 'Not found' });
      }
      const item = await getExposure(n);
      if (!item) return json(404, { message: 'Not found' });
      return json(200, toPublicExposure(item));
    }

    return json(404, { message: `Unknown route: ${routeKey}` });
  } catch (err) {
    console.error(err);
    return json(500, { message: 'Internal error' });
  }
};
