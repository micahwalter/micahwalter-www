/**
 * Exposure archive API client.
 * Base URL: NEXT_PUBLIC_EXPOSURES_API_URL, or derived from NEXT_PUBLIC_PHOTO_API_URL
 * by replacing a trailing /photos with /exposures.
 */

export type PublicExposure = {
  issueNumber: number;
  photoId: string;
  title: string;
  caption?: string;
  folderName: string;
  coverImageKey?: string;
  sentAt: string;
  createdAt?: string;
};

export type ExposureListPage = {
  items: PublicExposure[];
  cursor: string | null;
  limit: number;
};

export class ExposuresApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ExposuresApiError";
    this.status = status;
  }
}

export function getExposuresApiBase(): string {
  const explicit = process.env.NEXT_PUBLIC_EXPOSURES_API_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const photos = process.env.NEXT_PUBLIC_PHOTO_API_URL;
  if (photos) {
    const base = photos.replace(/\/$/, "");
    if (base.endsWith("/photos")) {
      return `${base.slice(0, -"/photos".length)}/exposures`;
    }
  }

  throw new Error(
    "NEXT_PUBLIC_EXPOSURES_API_URL is not set (and could not derive from NEXT_PUBLIC_PHOTO_API_URL)",
  );
}

async function readJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new ExposuresApiError(
      res.status === 404 ? "Not found." : "Could not load Exposures. Please try again.",
      res.status,
    );
  }
  return res.json() as Promise<T>;
}

/** List Exposures newest-first. Use trailing slash for ApiMappingKey. */
export async function listExposures(opts?: {
  limit?: number;
  cursor?: string | null;
}): Promise<ExposureListPage> {
  const limit = opts?.limit ?? 12;
  const params = new URLSearchParams({ limit: String(limit) });
  if (opts?.cursor) params.set("cursor", opts.cursor);

  const res = await fetch(`${getExposuresApiBase()}/?${params.toString()}`);
  const data = await readJson<ExposureListPage>(res);
  return {
    items: data.items || [],
    cursor: data.cursor ?? null,
    limit: data.limit ?? limit,
  };
}

export async function getExposure(n: string | number): Promise<PublicExposure> {
  const res = await fetch(`${getExposuresApiBase()}/${encodeURIComponent(String(n))}`);
  return readJson<PublicExposure>(res);
}

export function exposureCoverFilename(exposure: PublicExposure): string {
  const key = exposure.coverImageKey || "";
  const base = key.split("/").pop() || "photo";
  return base.replace(/\.(jpe?g|png|webp)$/i, "");
}
