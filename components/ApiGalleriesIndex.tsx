"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listGalleries,
  resolveGalleryPhotos,
  photoCoverFilename,
  photoIdString,
  type PublicGallery,
  type PublicPhoto,
} from "@/lib/photos-api";
import ApiGalleryCard from "./ApiGalleryCard";

type Row = {
  gallery: PublicGallery;
  cover: PublicPhoto | null;
};

export default function ApiGalleriesIndex() {
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const galleries = await listGalleries();
      const resolved = await Promise.all(
        galleries.map(async (gallery) => {
          const photos = await resolveGalleryPhotos(gallery.photoIds || []);
          const coverId =
            gallery.coverPhotoId != null ? String(gallery.coverPhotoId) : null;
          const cover =
            (coverId && photos.find((p) => photoIdString(p) === coverId)) ||
            photos[0] ||
            null;
          return { gallery, cover };
        }),
      );
      setRows(resolved);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (status === "loading") {
    return (
      <div className="max-w-wide mx-auto px-6 py-24 text-center text-gray">
        Loading galleries…
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="max-w-wide mx-auto px-6 py-24 text-center">
        <p className="text-gray text-lg mb-4">Could not load galleries.</p>
        <button type="button" onClick={load} className="underline text-charcoal">
          Retry
        </button>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="max-w-wide mx-auto px-6 py-24 text-center">
        <p className="text-gray text-lg">No galleries yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-wide mx-auto px-6 py-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {rows.map(({ gallery, cover }) => (
          <ApiGalleryCard
            key={gallery.slug}
            gallery={gallery}
            cover={cover}
            coverFilename={cover ? photoCoverFilename(cover) : "photo"}
          />
        ))}
      </div>
    </div>
  );
}
