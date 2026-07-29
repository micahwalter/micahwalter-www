/**
 * HTTP API for photos + galleries.
 * Routed by API Gateway routeKey on a single Lambda.
 *
 * Custom domain mapping key is `photos`, so public URLs are:
 *   GET/PATCH https://api.micahwalter.com/photos/...
 *   GET/POST/PATCH https://api.micahwalter.com/photos/galleries...
 * RouteKeys below are relative to that mapping (not prefixed with /photos).
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
const { buildExposureEmail } = require('./lib/exposure-email');
const { emitNewsletterSendRequested } = require('./lib/newsletter-events');
const {
  getGallery,
  listGalleries,
  putGallery,
  updateGallery,
  buildNewGallery,
  toPublicGallery,
} = require('./lib/galleries-db');

function json(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
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

function requestPath(event) {
  const raw = event.rawPath || event.requestContext?.http?.path || '';
  return raw.replace(/^\/photos(?=\/|$)/, '') || '/';
}

function isListRoute(routeKey, method, path) {
  if (routeKey === 'GET /' || routeKey === 'GET /photos') return true;
  return method === 'GET' && (path === '/' || path === '');
}

function isGalleriesList(routeKey, method, path) {
  if (routeKey === 'GET /galleries' || routeKey === 'GET /photos/galleries') return true;
  return method === 'GET' && (path === '/galleries' || path === '/galleries/');
}

function isGalleryItem(routeKey, method, path) {
  if (
    routeKey === 'GET /galleries/{slug}' ||
    routeKey === 'GET /photos/galleries/{slug}' ||
    routeKey === 'PATCH /galleries/{slug}' ||
    routeKey === 'PATCH /photos/galleries/{slug}'
  ) {
    return true;
  }
  return (method === 'GET' || method === 'PATCH') && /^\/galleries\/[^/]+$/.test(path);
}

function isGalleryCreate(routeKey, method, path) {
  if (routeKey === 'POST /galleries' || routeKey === 'POST /photos/galleries') return true;
  return method === 'POST' && (path === '/galleries' || path === '/galleries/');
}

function gallerySlugFrom(event, path) {
  return event.pathParameters?.slug || path.replace(/^\/galleries\//, '').replace(/\/$/, '');
}

function isExposureTest(routeKey, method, path) {
  if (
    routeKey === 'POST /{id}/exposure-test' ||
    routeKey === 'POST /photos/{id}/exposure-test'
  ) {
    return true;
  }
  return method === 'POST' && /^\/[^/]+\/exposure-test\/?$/.test(path);
}

function photoIdFromExposureTestPath(event, path) {
  if (event.pathParameters?.id) return event.pathParameters.id;
  const m = path.match(/^\/([^/]+)\/exposure-test\/?$/);
  return m ? m[1] : '';
}

async function requireAuth(event, body) {
  const secret = await getSecret();
  const token = extractToken(event, body);
  if (!verify(secret.hmac, token)) {
    const err = new Error('Session expired or invalid');
    err.statusCode = 401;
    throw err;
  }
  return token;
}

exports.handler = async (event) => {
  const routeKey = event.routeKey || '';
  const method = event.requestContext?.http?.method || event.requestContext?.httpMethod || 'GET';
  const path = requestPath(event);

  // Defense-in-depth if a catch-all route is ever added; prefer API Gateway CORS.
  if (method === 'OPTIONS') {
    return { statusCode: 204 };
  }

  try {
    // --- Galleries (must run before GET /{id}) ---
    if (isGalleriesList(routeKey, method, path)) {
      const qs = event.queryStringParameters || {};
      let includeDrafts = false;
      if (qs.all === '1' || qs.all === 'true') {
        try {
          await requireAuth(event, {});
          includeDrafts = true;
        } catch {
          return json(401, { message: 'Session expired or invalid' });
        }
      }
      const items = await listGalleries({ includeDrafts });
      return json(200, { items: items.map(toPublicGallery) });
    }

    if (isGalleryCreate(routeKey, method, path)) {
      let body = {};
      try {
        body = JSON.parse(event.body || '{}');
      } catch {
        return json(400, { message: 'Invalid request body' });
      }
      try {
        await requireAuth(event, body);
      } catch (err) {
        return json(401, { message: err.message });
      }
      try {
        const gallery = buildNewGallery(body);
        await putGallery(gallery, { overwrite: false });
        return json(201, toPublicGallery(gallery));
      } catch (err) {
        if (err.name === 'ConditionalCheckFailedException') {
          return json(409, { message: 'Gallery slug already exists' });
        }
        if (err.statusCode === 400) return json(400, { message: err.message });
        throw err;
      }
    }

    if (isGalleryItem(routeKey, method, path)) {
      const slug = gallerySlugFrom(event, path);
      if (!slug) return json(400, { message: 'Missing slug' });

      if (method === 'GET') {
        const gallery = await getGallery(slug);
        if (!gallery) return json(404, { message: 'Not found' });
        // Public: hide drafts unless Authorization present and valid
        if (gallery.draft) {
          try {
            await requireAuth(event, {});
          } catch {
            return json(404, { message: 'Not found' });
          }
        }
        return json(200, toPublicGallery(gallery));
      }

      if (method === 'PATCH') {
        let body = {};
        try {
          body = JSON.parse(event.body || '{}');
        } catch {
          return json(400, { message: 'Invalid request body' });
        }
        try {
          await requireAuth(event, body);
        } catch (err) {
          return json(401, { message: err.message });
        }
        const patch = {};
        if (body.title !== undefined) patch.title = String(body.title).trim();
        if (body.description !== undefined) patch.description = String(body.description);
        if (body.coverPhotoId !== undefined) {
          patch.coverPhotoId =
            body.coverPhotoId === null || body.coverPhotoId === ''
              ? null
              : String(body.coverPhotoId);
        }
        if (body.publishedAt !== undefined) patch.publishedAt = String(body.publishedAt);
        if (body.photoIds !== undefined) {
          if (!Array.isArray(body.photoIds)) {
            return json(400, { message: 'photoIds must be an array' });
          }
          patch.photoIds = body.photoIds;
        }
        if (body.draft !== undefined) patch.draft = !!body.draft;
        if (body.content !== undefined) patch.content = String(body.content);
        if (patch.title === '') return json(400, { message: 'title cannot be empty' });

        try {
          const updated = await updateGallery(slug, patch);
          return json(200, toPublicGallery(updated));
        } catch (err) {
          if (err.name === 'ConditionalCheckFailedException') {
            return json(404, { message: 'Not found' });
          }
          if (err.statusCode === 400) return json(400, { message: err.message });
          throw err;
        }
      }
    }

    // --- Photos ---
    if (isExposureTest(routeKey, method, path)) {
      const id = photoIdFromExposureTestPath(event, path);
      if (!id || id === 'featured' || id === 'galleries') {
        return json(404, { message: 'Not found' });
      }

      let body = {};
      try {
        body = JSON.parse(event.body || '{}');
      } catch {
        return json(400, { message: 'Invalid request body' });
      }

      try {
        await requireAuth(event, body);
      } catch (err) {
        return json(401, { message: err.message });
      }

      const adminEmail = (process.env.ADMIN_EMAIL || '').trim();
      if (!adminEmail) {
        return json(500, { message: 'ADMIN_EMAIL is not configured' });
      }

      const photo = await getPhoto(id);
      if (!photo) return json(404, { message: 'Not found' });
      if (photo.draft) {
        return json(400, { message: 'Cannot send Exposure test for a draft photo' });
      }

      const built = buildExposureEmail(photo, { isTest: true });
      await emitNewsletterSendRequested({
        emailId: 0,
        slug: built.slug,
        title: built.subject,
        htmlBody: built.htmlBody,
        textBody: built.textBody,
        viewInBrowserUrl: built.viewInBrowserUrl,
        testEmail: adminEmail,
      });

      console.log(
        JSON.stringify({
          msg: 'exposure-test-queued',
          photoId: String(photo.id),
          adminEmailDomain: adminEmail.includes('@') ? adminEmail.split('@')[1] : 'unknown',
        }),
      );

      return json(200, { ok: true, message: 'Test Exposure queued' });
    }

    if (isListRoute(routeKey, method, path)) {
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

    if (routeKey === 'GET /featured' || routeKey === 'GET /photos/featured' || (method === 'GET' && path === '/featured')) {
      const photo = await getFeaturedPhoto();
      if (!photo) return json(404, { message: 'No photos' });
      return json(200, toPublicPhoto(photo));
    }

    if (routeKey === 'GET /{id}' || routeKey === 'GET /photos/{id}' || (method === 'GET' && /^\/[^/]+$/.test(path))) {
      const id = event.pathParameters?.id || path.slice(1);
      if (!id || id === 'featured' || id === 'galleries') return json(404, { message: 'Not found' });
      const photo = await getPhoto(id);
      if (!photo || photo.draft) return json(404, { message: 'Not found' });
      return json(200, toPublicPhoto(photo));
    }

    if (routeKey === 'PATCH /{id}' || routeKey === 'PATCH /photos/{id}' || (method === 'PATCH' && /^\/[^/]+$/.test(path))) {
      const id = event.pathParameters?.id || path.slice(1);
      if (!id) return json(400, { message: 'Missing id' });

      let body = {};
      try {
        body = JSON.parse(event.body || '{}');
      } catch {
        return json(400, { message: 'Invalid request body' });
      }

      try {
        await requireAuth(event, body);
      } catch (err) {
        return json(401, { message: err.message });
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
      if (body.exposureEligible !== undefined) patch.exposureEligible = !!body.exposureEligible;

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
