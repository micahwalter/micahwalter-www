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

/** List photos newest-first. Prefer trailing slash for API Gateway custom-domain quirks. */
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

/**
 * OSM-style static map URL from public (fuzzed) coordinates.
 * Hide the image on load error in the UI.
 */
export function buildStaticMapUrl(
  lat: number,
  lon: number,
  opts?: { zoom?: number; width?: number; height?: number },
): string {
  const zoom = opts?.zoom ?? 12;
  const width = opts?.width ?? 600;
  const height = opts?.height ?? 300;
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lon}&zoom=${zoom}&size=${width}x${height}&markers=${lat},${lon},lightblue1`;
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

/** Parse comma-separated tags into a trimmed string array. */
export function parseTagsInput(value: string): string[] {
  return value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}
