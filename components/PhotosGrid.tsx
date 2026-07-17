"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  listPhotos,
  photoCoverFilename,
  photoIdString,
  type PublicPhoto,
} from "@/lib/photos-api";
import { CoverImage } from "./ResponsiveImage";

const PAGE_SIZE = 12;

export default function PhotosGrid() {
  const [items, setItems] = useState<PublicPhoto[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const page = await listPhotos({ limit: PAGE_SIZE });
      setItems(page.items);
      setCursor(page.cursor);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await listPhotos({ limit: PAGE_SIZE, cursor });
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.cursor);
    } catch {
      setError(true);
    } finally {
      setLoadingMore(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-wide mx-auto px-6 py-24 text-center text-gray">
        Loading photos…
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className="max-w-wide mx-auto px-6 py-24 text-center">
        <p className="text-gray text-lg mb-4">Could not load photos.</p>
        <button
          type="button"
          onClick={loadInitial}
          className="text-charcoal underline hover:text-accent"
        >
          Retry
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-wide mx-auto px-6 py-24 text-center">
        <p className="text-gray text-lg">No photos yet. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="max-w-wide mx-auto px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.map((photo) => {
          const id = photoIdString(photo);
          const exif = photo.exif || {};
          const exifSummary = [exif.camera, exif.aperture, exif.shutterSpeed]
            .filter(Boolean)
            .slice(0, 2)
            .join(" • ");

          return (
            <Link
              key={id}
              href={`/photos/${id}`}
              className="group block no-underline"
            >
              <article className="h-full transition-transform duration-200 hover:-translate-y-1">
                <div className="w-full mb-4 relative">
                  <CoverImage
                    folderName={photo.folderName}
                    filename={photoCoverFilename(photo)}
                    alt={photo.title}
                    className="w-full h-auto rounded-lg transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 400px, 500px"
                  />
                  {exifSummary && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-charcoal/90 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-lg">
                      <p className="text-xs text-cream/80 font-mono">
                        {exifSummary}
                      </p>
                    </div>
                  )}
                </div>
                <h2 className="font-serif text-xl text-charcoal group-hover:text-accent transition-colors">
                  {photo.title}
                </h2>
                <time className="text-sm text-gray">
                  {format(new Date(photo.publishedAt), "MMMM d, yyyy")}
                </time>
              </article>
            </Link>
          );
        })}
      </div>

      {cursor && (
        <div className="mt-12 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-2 text-sm font-medium text-charcoal border border-gray/30 rounded-lg hover:bg-charcoal/5 transition-colors disabled:opacity-50"
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
