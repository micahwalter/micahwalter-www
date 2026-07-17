"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  getAdminToken,
  getPhoto,
  photoCoverFilename,
  photoIdString,
  PhotoApiError,
  type PublicPhoto,
} from "@/lib/photos-api";
import { CoverImage } from "./ResponsiveImage";
import PhotoStaticMap from "./PhotoStaticMap";
import Comments from "./Comments";

interface ApiPhotoDetailProps {
  /** Preferred id from the URL; also re-read from window.location for CF shell rewrite. */
  idHint: string;
}

type Status = "loading" | "ready" | "notfound" | "error";

function resolveId(hint: string): string {
  if (typeof window !== "undefined") {
    const m = window.location.pathname.match(/^\/photos\/(\d+)/);
    if (m?.[1]) return m[1];
  }
  return hint;
}

function ExifPanel({ photo }: { photo: PublicPhoto }) {
  const exif = photo.exif || {};
  const hasExif =
    exif.camera ||
    exif.lens ||
    exif.aperture ||
    exif.shutterSpeed ||
    exif.iso ||
    exif.focalLength ||
    exif.dateTaken;

  if (!hasExif) return null;

  const formattedDateTaken = exif.dateTaken
    ? format(new Date(exif.dateTaken), "MMMM d, yyyy 'at' h:mm a")
    : null;

  return (
    <div className="bg-gray/5 rounded-lg p-6 border border-gray/10">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray mb-4">
        Photo Information
      </h3>
      <dl className="space-y-3 text-sm text-charcoal">
        {exif.camera && (
          <div>
            <dt className="text-xs uppercase text-gray/70">Camera</dt>
            <dd className="font-medium">{exif.camera}</dd>
          </div>
        )}
        {exif.lens && (
          <div>
            <dt className="text-xs uppercase text-gray/70">Lens</dt>
            <dd className="font-medium">{exif.lens}</dd>
          </div>
        )}
        {exif.aperture && (
          <div>
            <dt className="text-xs uppercase text-gray/70">Aperture</dt>
            <dd className="font-medium">{exif.aperture}</dd>
          </div>
        )}
        {exif.shutterSpeed && (
          <div>
            <dt className="text-xs uppercase text-gray/70">Shutter</dt>
            <dd className="font-medium">{exif.shutterSpeed}</dd>
          </div>
        )}
        {exif.iso && (
          <div>
            <dt className="text-xs uppercase text-gray/70">ISO</dt>
            <dd className="font-medium">{exif.iso}</dd>
          </div>
        )}
        {exif.focalLength && (
          <div>
            <dt className="text-xs uppercase text-gray/70">Focal length</dt>
            <dd className="font-medium">{exif.focalLength}</dd>
          </div>
        )}
        {formattedDateTaken && (
          <div>
            <dt className="text-xs uppercase text-gray/70">Taken</dt>
            <dd className="font-medium">{formattedDateTaken}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

export default function ApiPhotoDetail({ idHint }: ApiPhotoDetailProps) {
  const [status, setStatus] = useState<Status>("loading");
  const [photo, setPhoto] = useState<PublicPhoto | null>(null);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    setCanEdit(!!getAdminToken());
  }, []);

  const load = useCallback(async () => {
    const id = resolveId(idHint);
    if (!id) {
      setStatus("notfound");
      return;
    }
    setStatus("loading");
    try {
      const data = await getPhoto(id);
      setPhoto(data);
      setStatus("ready");
    } catch (err) {
      if (err instanceof PhotoApiError && err.status === 404) {
        setStatus("notfound");
      } else {
        setStatus("error");
      }
    }
  }, [idHint]);

  useEffect(() => {
    load();
  }, [load]);

  if (status === "loading") {
    return (
      <div className="max-w-wide mx-auto px-6 py-24 text-center text-gray">
        Loading photo…
      </div>
    );
  }

  if (status === "notfound") {
    return (
      <div className="max-w-wide mx-auto px-6 py-24 text-center">
        <p className="text-gray text-lg mb-4">Photo not found.</p>
        <Link href="/photos" className="text-charcoal underline hover:text-accent">
          Back to photos
        </Link>
      </div>
    );
  }

  if (status === "error" || !photo) {
    return (
      <div className="max-w-wide mx-auto px-6 py-24 text-center">
        <p className="text-gray text-lg mb-4">Could not load this photo.</p>
        <button
          type="button"
          onClick={load}
          className="text-charcoal underline hover:text-accent"
        >
          Retry
        </button>
      </div>
    );
  }

  const id = photoIdString(photo);
  const formattedDate = format(new Date(photo.publishedAt), "MMMM d, yyyy");
  const tags = photo.tags || [];
  const lat = photo.publicLatitude;
  const lon = photo.publicLongitude;
  const hasMap =
    typeof lat === "number" &&
    typeof lon === "number" &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lon);
  const placeLabel = [photo.city, photo.country].filter(Boolean).join(", ") || null;

  return (
    <article className="max-w-wide mx-auto px-6 py-12">
      <div className="mb-8">
        <CoverImage
          folderName={photo.folderName}
          filename={photoCoverFilename(photo)}
          alt={photo.title}
          className="rounded-lg"
          priority={true}
          sizes="(max-width: 768px) 100vw, 1340px"
          zoomable={true}
          viewportFit={true}
        />
      </div>

      <header className="mb-8 max-w-reading mx-auto">
        <div className="mb-4">
          <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wide uppercase bg-charcoal text-cream rounded-full">
            {photo.category || "Photography"}
          </span>
        </div>
        <h1 className="font-serif font-semibold text-4xl md:text-5xl mb-4 text-charcoal">
          {photo.title}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-gray">
          <time dateTime={photo.publishedAt}>{formattedDate}</time>
          {tags.length > 0 && (
            <>
              <span>·</span>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/photos?tag=${encodeURIComponent(tag.toLowerCase())}`}
                    className="text-xs text-gray border border-gray/30 rounded px-2 py-1 no-underline hover:border-gray hover:bg-gray/10 transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-reading mx-auto">
        <div className="md:col-span-2">
          {photo.caption ? (
            <p className="text-lg text-charcoal whitespace-pre-wrap">{photo.caption}</p>
          ) : null}

          {canEdit && (
            <div className="mt-8">
              <Link
                href={`/upload?edit=${id}`}
                className="text-sm text-charcoal underline hover:text-accent"
              >
                Edit photo →
              </Link>
            </div>
          )}

          {hasMap ? (
            <PhotoStaticMap latitude={lat!} longitude={lon!} label={placeLabel} />
          ) : placeLabel ? (
            <div className="mt-8">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray mb-1">
                Location
              </h3>
              <p className="text-sm text-charcoal">{placeLabel}</p>
            </div>
          ) : null}

          <Comments />
        </div>
        <aside className="md:col-span-1">
          <ExifPanel photo={photo} />
        </aside>
      </div>
    </article>
  );
}
