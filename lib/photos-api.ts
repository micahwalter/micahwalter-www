/**
 * Photo API client helpers (upload + browse/edit).
 * Base URL: NEXT_PUBLIC_PHOTO_API_URL (e.g. https://api.micahwalter.com/photos)
 */

export type PublicPhotoExif = {
  camera?: string;
  lens?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: string;
  focalLength?: string;
  dateTaken?: string;
  width?: number;
  height?: number;
  format?: string;
};

export type PublicPhoto = {
  id: string | number;
  title: string;
  caption?: string;
  publishedAt: string;
  createdAt?: string;
  updatedAt?: string;
  featured?: boolean;
  /** Eligible for weekly Exposure newsletter (owner-set). */
  exposureEligible?: boolean;
  /** ISO timestamp when included in a production Exposure send (U3). */
  exposureSentAt?: string | null;
  /** Exposure issue number when sent (U3). */
  exposureIssueNumber?: number | null;
  tags?: string[];
  enrichmentStatus?: string;
  folderName: string;
  coverImageKey?: string;
  category?: string;
  exif?: PublicPhotoExif;
  publicLatitude?: number | null;
  publicLongitude?: number | null;
  city?: string | null;
  country?: string | null;
};

export type PhotoListPage = {
  items: PublicPhoto[];
  cursor: string | null;
  limit: number;
};

export function getPhotoApiBase(): string {
  const base = process.env.NEXT_PUBLIC_PHOTO_API_URL;
  if (!base) {
    throw new Error("NEXT_PUBLIC_PHOTO_API_URL is not set");
  }
  return base.replace(/\/$/, "");
}

export class PhotoApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "PhotoApiError";
    this.status = status;
  }
}

export async function authWithPasscode(passcode: string): Promise<{ token: string }> {
  const res = await fetch(`${getPhotoApiBase()}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ passcode }),
  });

  if (!res.ok) {
    throw new PhotoApiError(
      res.status === 401 ? "Incorrect passcode." : "Could not sign in. Please try again.",
      res.status,
    );
  }

  return res.json() as Promise<{ token: string }>;
}

export type UploadUrlInput = {
  token: string;
  filename: string;
  contentType: string;
  title?: string;
  caption?: string;
  featured?: boolean;
  exposureEligible?: boolean;
};

export type UploadUrlResult = {
  url: string;
  headers: Record<string, string>;
  key?: string;
};

export async function getUploadUrl(input: UploadUrlInput): Promise<UploadUrlResult> {
  const res = await fetch(`${getPhotoApiBase()}/upload-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: input.token,
      filename: input.filename,
      contentType: input.contentType || "application/octet-stream",
      title: input.title ?? "",
      caption: input.caption ?? "",
      featured: !!input.featured,
      exposureEligible: !!input.exposureEligible,
    }),
  });

  if (!res.ok) {
    throw new PhotoApiError(
      res.status === 401
        ? "Your session expired. Please enter the passcode again."
        : "Could not start upload. Please try again.",
      res.status,
    );
  }

  return res.json() as Promise<UploadUrlResult>;
}

/**
 * PUT file to a presigned S3 URL. Reports progress 0–100 when supported.
 */
export function putToPresignedUrl(
  url: string,
  headers: Record<string, string>,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    for (const [k, v] of Object.entries(headers)) {
      xhr.setRequestHeader(k, v);
    }
    xhr.upload.onprogress = (e) => {
      if (!onProgress || !e.lengthComputable) return;
      onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error("upload failed"));
    };
    xhr.onerror = () => reject(new Error("upload failed"));
    xhr.send(file);
  });
}

async function readJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new PhotoApiError(
      res.status === 404 ? "Not found." : "Could not load photos. Please try again.",
      res.status,
    );
  }
  return res.json() as Promise<T>;
}

/** List photos newest-first. Always use trailing slash — bare GET /photos 404s with ApiMappingKey. */
export async function listPhotos(opts?: {
  limit?: number;
  cursor?: string | null;
}): Promise<PhotoListPage> {
  const limit = opts?.limit ?? 12;
  const params = new URLSearchParams({ limit: String(limit) });
  if (opts?.cursor) params.set("cursor", opts.cursor);

  const res = await fetch(`${getPhotoApiBase()}/?${params.toString()}`);
  const data = await readJson<PhotoListPage>(res);
  return {
    items: data.items || [],
    cursor: data.cursor ?? null,
    limit: data.limit ?? limit,
  };
}

export async function getFeaturedPhoto(): Promise<PublicPhoto | null> {
  const res = await fetch(`${getPhotoApiBase()}/featured`);
  if (res.status === 404) return null;
  return readJson<PublicPhoto>(res);
}

export async function getPhoto(id: string | number): Promise<PublicPhoto> {
  const res = await fetch(`${getPhotoApiBase()}/${id}`);
  return readJson<PublicPhoto>(res);
}

/** Filename stem for CoverImage (e.g. images/posts/folder/photo.jpg → photo). */
export function photoCoverFilename(photo: PublicPhoto): string {
  const key = photo.coverImageKey || "";
  const base = key.split("/").pop() || "photo";
  return base.replace(/\.(jpe?g|png|webp)$/i, "");
}

export function photoIdString(photo: PublicPhoto): string {
  return String(photo.id);
}

/** OpenStreetMap browse link for public (fuzzed) coordinates. */
export function buildOsmBrowseUrl(lat: number, lon: number): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=12/${lat}/${lon}`;
}

/**
 * OSM embed iframe URL (no API key). Uses a small bbox around public coords.
 * Prefer this over staticmap.openstreetmap.de (host no longer resolves).
 */
export function buildOsmEmbedUrl(lat: number, lon: number, delta = 0.04): string {
  const minLon = lon - delta;
  const minLat = lat - delta;
  const maxLon = lon + delta;
  const maxLat = lat + delta;
  const bbox = [minLon, minLat, maxLon, maxLat].join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${lat},${lon}`)}`;
}

/** @deprecated Use buildOsmEmbedUrl / buildOsmBrowseUrl — dead staticmap host. */
export function buildStaticMapUrl(lat: number, lon: number): string {
  return buildOsmEmbedUrl(lat, lon);
}

/** Prefetch up to ~100 photos for client-side search filtering. */
export async function prefetchPhotosForSearch(maxItems = 100): Promise<PublicPhoto[]> {
  const items: PublicPhoto[] = [];
  let cursor: string | null = null;
  const pageSize = 50;
  const maxPages = Math.ceil(maxItems / pageSize);

  for (let i = 0; i < maxPages; i++) {
    const page = await listPhotos({ limit: pageSize, cursor });
    items.push(...page.items);
    cursor = page.cursor;
    if (!cursor || items.length >= maxItems) break;
  }

  return items.slice(0, maxItems);
}

const ADMIN_TOKEN_KEY = "micahwalter.photoAdminToken";

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearAdminToken(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export type PhotoUpdatePatch = {
  title?: string;
  caption?: string;
  tags?: string[];
  featured?: boolean;
  exposureEligible?: boolean;
};

export async function updatePhoto(
  id: string | number,
  patch: PhotoUpdatePatch,
  token: string,
): Promise<PublicPhoto> {
  const res = await fetch(`${getPhotoApiBase()}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ...patch, token }),
  });

  if (!res.ok) {
    throw new PhotoApiError(
      res.status === 401
        ? "Your session expired. Please enter the passcode again."
        : res.status === 400
          ? "Could not save. Check the fields and try again."
          : "Could not save. Please try again.",
      res.status,
    );
  }

  return res.json() as Promise<PublicPhoto>;
}

/** Queue a test Exposure email to AdminEmail (does not stamp or blast subscribers). */
export async function sendExposureTest(
  id: string | number,
  token: string,
): Promise<{ ok: boolean; message?: string }> {
  const res = await fetch(`${getPhotoApiBase()}/${id}/exposure-test`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ token }),
  });

  if (!res.ok) {
    let message = "Could not send test Exposure.";
    if (res.status === 401) {
      message = "Your session expired. Please enter the passcode again.";
    } else if (res.status === 400) {
      try {
        const data = (await res.json()) as { message?: string };
        if (data.message) message = data.message;
      } catch {
        /* keep default */
      }
    }
    throw new PhotoApiError(message, res.status);
  }

  return res.json() as Promise<{ ok: boolean; message?: string }>;
}

/** Parse comma-separated tags into a trimmed string array. */
export function parseTagsInput(value: string): string[] {
  return value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export type PublicGallery = {
  slug: string;
  title: string;
  description?: string;
  coverPhotoId?: string | number | null;
  publishedAt: string;
  photoIds: (string | number)[];
  draft?: boolean;
  content?: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function listGalleries(opts?: {
  includeDrafts?: boolean;
  token?: string;
}): Promise<PublicGallery[]> {
  const params = new URLSearchParams();
  const headers: Record<string, string> = {};
  if (opts?.includeDrafts) {
    params.set("all", "1");
    if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  }
  const qs = params.toString();
  const res = await fetch(
    `${getPhotoApiBase()}/galleries${qs ? `?${qs}` : ""}`,
    { headers },
  );
  const data = await readJson<{ items: PublicGallery[] }>(res);
  return data.items || [];
}

export async function getGallery(slug: string): Promise<PublicGallery> {
  const res = await fetch(`${getPhotoApiBase()}/galleries/${encodeURIComponent(slug)}`);
  return readJson<PublicGallery>(res);
}

export async function createGallery(
  input: {
    slug: string;
    title: string;
    description?: string;
    coverPhotoId?: string | null;
    publishedAt?: string;
    photoIds?: (string | number)[];
    draft?: boolean;
    content?: string;
  },
  token: string,
): Promise<PublicGallery> {
  const res = await fetch(`${getPhotoApiBase()}/galleries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ...input, token }),
  });
  if (!res.ok) {
    throw new PhotoApiError(
      res.status === 401
        ? "Your session expired. Please enter the passcode again."
        : res.status === 409
          ? "A gallery with that slug already exists."
          : "Could not create gallery.",
      res.status,
    );
  }
  return res.json() as Promise<PublicGallery>;
}

export async function updateGallery(
  slug: string,
  patch: {
    title?: string;
    description?: string;
    coverPhotoId?: string | null;
    publishedAt?: string;
    photoIds?: (string | number)[];
    draft?: boolean;
    content?: string;
  },
  token: string,
): Promise<PublicGallery> {
  const res = await fetch(`${getPhotoApiBase()}/galleries/${encodeURIComponent(slug)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ...patch, token }),
  });
  if (!res.ok) {
    throw new PhotoApiError(
      res.status === 401
        ? "Your session expired. Please enter the passcode again."
        : res.status === 404
          ? "Gallery not found."
          : "Could not save gallery.",
      res.status,
    );
  }
  return res.json() as Promise<PublicGallery>;
}

/** Resolve photo ids with modest concurrency; skip missing. */
export async function resolveGalleryPhotos(
  photoIds: (string | number)[],
  concurrency = 4,
): Promise<PublicPhoto[]> {
  const ids = photoIds.map(String).filter(Boolean);
  const out: PublicPhoto[] = [];
  let i = 0;

  async function worker() {
    while (i < ids.length) {
      const id = ids[i++];
      try {
        out.push(await getPhoto(id));
      } catch {
        /* skip missing */
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, ids.length || 1) }, () => worker()),
  );

  // Preserve membership order
  const byId = new Map(out.map((p) => [photoIdString(p), p]));
  return ids.map((id) => byId.get(id)).filter((p): p is PublicPhoto => !!p);
}
