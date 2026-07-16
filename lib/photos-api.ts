/**
 * Photo API client helpers (upload + future browse/edit).
 * Base URL: NEXT_PUBLIC_PHOTO_API_URL (e.g. https://api.micahwalter.com/photos)
 */

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
