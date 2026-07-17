"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  getGallery,
  resolveGalleryPhotos,
  photoCoverFilename,
  photoIdString,
  PhotoApiError,
  type PublicGallery,
  type PublicPhoto,
} from "@/lib/photos-api";
import type { Post } from "@/lib/content";
import GalleryViewer from "./GalleryViewer";

function toViewerPost(photo: PublicPhoto): Post {
  const filename = photoCoverFilename(photo);
  const id = photoIdString(photo);
  return {
    slug: id,
    id,
    folderName: photo.folderName,
    title: photo.title,
    publishedAt: photo.publishedAt,
    excerpt: photo.caption || "",
    category: photo.category || "Photography",
    tags: photo.tags || [],
    coverImage: `./${filename}.jpg`,
    draft: false,
    content: "",
    type: "photo",
    camera: photo.exif?.camera,
    lens: photo.exif?.lens,
    aperture: photo.exif?.aperture,
    shutterSpeed: photo.exif?.shutterSpeed,
    iso: photo.exif?.iso,
    focalLength: photo.exif?.focalLength,
    dateTaken: photo.exif?.dateTaken,
  };
}

function resolveSlug(hint: string): string {
  if (typeof window !== "undefined") {
    const m = window.location.pathname.match(/^\/galleries\/([^/]+)/);
    if (m?.[1] && m[1] !== "_placeholder") return decodeURIComponent(m[1]);
  }
  return hint;
}

interface ApiGalleryDetailProps {
  slugHint: string;
}

export default function ApiGalleryDetail({ slugHint }: ApiGalleryDetailProps) {
  const [status, setStatus] = useState<"loading" | "ready" | "notfound" | "error">(
    "loading",
  );
  const [gallery, setGallery] = useState<PublicGallery | null>(null);
  const [photos, setPhotos] = useState<Post[]>([]);

  const load = useCallback(async () => {
    const slug = resolveSlug(slugHint);
    if (!slug || slug === "_placeholder") {
      setStatus("notfound");
      return;
    }
    setStatus("loading");
    try {
      const g = await getGallery(slug);
      const resolved = await resolveGalleryPhotos(g.photoIds || []);
      setGallery(g);
      setPhotos(resolved.map(toViewerPost));
      setStatus("ready");
    } catch (err) {
      if (err instanceof PhotoApiError && err.status === 404) setStatus("notfound");
      else setStatus("error");
    }
  }, [slugHint]);

  useEffect(() => {
    load();
  }, [load]);

  if (status === "loading") {
    return (
      <div className="max-w-wide mx-auto px-6 py-24 text-center text-gray">
        Loading gallery…
      </div>
    );
  }

  if (status === "notfound") {
    return (
      <div className="max-w-wide mx-auto px-6 py-24 text-center">
        <p className="text-gray text-lg mb-4">Gallery not found.</p>
        <Link href="/galleries" className="underline text-charcoal">
          Back to galleries
        </Link>
      </div>
    );
  }

  if (status === "error" || !gallery) {
    return (
      <div className="max-w-wide mx-auto px-6 py-24 text-center">
        <p className="text-gray text-lg mb-4">Could not load gallery.</p>
        <button type="button" onClick={load} className="underline text-charcoal">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="max-w-wide mx-auto px-6 py-12 border-b border-gray/20">
        <Link
          href="/galleries"
          className="text-sm text-gray hover:text-charcoal no-underline mb-4 inline-block"
        >
          ← Galleries
        </Link>
        <h1 className="font-serif font-semibold text-4xl md:text-5xl mb-4 text-charcoal">
          {gallery.title}
        </h1>
        {gallery.description && (
          <p className="text-lg text-gray max-w-reading">{gallery.description}</p>
        )}
      </header>

      {photos.length > 0 ? (
        <GalleryViewer photos={photos} />
      ) : (
        <div className="max-w-wide mx-auto px-6 py-24 text-center text-gray">
          No photos in this gallery yet.
        </div>
      )}
    </div>
  );
}
