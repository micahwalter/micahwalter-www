/**
 * HTTP API for photos — GET list/featured/{id}, PATCH {id}.
 * Routed by API Gateway routeKey on a single Lambda.
 */

const { getSecret } = require('./lib/secrets');
const { verify } = require('./lib/token');
const {
  getPhoto,
  updatePhoto,
  listPhotos,
  getFeaturedPhoto,
} = require('./lib/photos-db');
const { toPublicPhoto } = require('./lib/photo-dto');

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function extractToken(event, body) {
  const auth = event.headers?.authorization || event.headers?.Authorization || '';
  if (auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }
  return body?.token;
}

exports.handler = async (event) => {
  const routeKey = event.routeKey || '';

  try {
    if (routeKey === 'GET /photos') {
      const qs = event.queryStringParameters || {};
      const limit = qs.limit;
      const cursor = qs.cursor;
      const page = await listPhotos({ limit, cursor });
      return json(200, {
        items: page.items.map(toPublicPhoto),
        cursor: page.cursor,
        limit: Math.min(Math.max(Number(limit) || 12, 1), 50),
      });
    }

    if (routeKey === 'GET /photos/featured') {
      const photo = await getFeaturedPhoto();
      if (!photo) return json(404, { message: 'No photos' });
      return json(200, toPublicPhoto(photo));
    }

    if (routeKey === 'GET /photos/{id}') {
      const id = event.pathParameters?.id;
      if (!id) return json(400, { message: 'Missing id' });
      const photo = await getPhoto(id);
      if (!photo || photo.draft) return json(404, { message: 'Not found' });
      return json(200, toPublicPhoto(photo));
    }

    if (routeKey === 'PATCH /photos/{id}') {
      const id = event.pathParameters?.id;
      if (!id) return json(400, { message: 'Missing id' });

      let body = {};
      try {
        body = JSON.parse(event.body || '{}');
      } catch {
        return json(400, { message: 'Invalid request body' });
      }

      const secret = await getSecret();
      const token = extractToken(event, body);
      if (!verify(secret.hmac, token)) {
        return json(401, { message: 'Session expired or invalid' });
      }

      const patch = {};
      if (body.title !== undefined) {
        const t = String(body.title).trim();
        if (!t) return json(400, { message: 'title cannot be empty' });
        patch.title = t;
      }
      if (body.caption !== undefined) patch.caption = String(body.caption);
      if (body.tags !== undefined) {
        if (!Array.isArray(body.tags)) return json(400, { message: 'tags must be an array' });
        patch.tags = body.tags.map(String);
      }
      if (body.featured !== undefined) patch.featured = !!body.featured;
      if (body.draft !== undefined) patch.draft = !!body.draft;

      try {
        const updated = await updatePhoto(id, patch);
        return json(200, toPublicPhoto(updated));
      } catch (err) {
        if (err.name === 'ConditionalCheckFailedException') {
          return json(404, { message: 'Not found' });
        }
        if (err.statusCode === 400) return json(400, { message: err.message });
        throw err;
      }
    }

    return json(404, { message: `Unknown route: ${routeKey}` });
  } catch (err) {
    console.error(err);
    return json(500, { message: 'Internal error' });
  }
};
