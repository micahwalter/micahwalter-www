"use client";

import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  listPhotos,
  prefetchPhotosForSearch,
  photoCoverFilename,
  photoIdString,
  type PublicPhoto,
} from "@/lib/photos-api";
import { CoverImage } from "./ResponsiveImage";

const PAGE_SIZE = 12;

function readTagFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get("tag");
  if (!raw) return null;
  const t = raw.trim().toLowerCase();
  return t || null;
}

function matchesTag(photo: PublicPhoto, tag: string): boolean {
  return (photo.tags || []).some((t) => String(t).toLowerCase() === tag);
}

export default function PhotosGrid() {
  const [tag, setTag] = useState<string | null>(null);
  const [items, setItems] = useState<PublicPhoto[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setTag(readTagFromUrl());
    const onPop = () => setTag(readTagFromUrl());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      if (tag) {
        const all = await prefetchPhotosForSearch(200);
        setItems(all.filter((p) => matchesTag(p, tag)));
        setCursor(null);
      } else {
        const page = await listPhotos({ limit: PAGE_SIZE });
        setItems(page.items);
        setCursor(page.cursor);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [tag]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  async function loadMore() {
    if (!cursor || loadingMore || tag) return;
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

  const heading = useMemo(() => {
    if (!tag) return null;
    return tag;
  }, [tag]);

  function clearTagFilter(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    const url = new URL(window.location.href);
    url.searchParams.delete("tag");
    window.history.pushState({}, "", url.pathname + url.search);
    setTag(null);
  }

  if (loading) {
    return (
      <div className="max-w-wide mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[4/3] rounded-lg bg-gray/15" />
              <div className="h-5 w-2/3 rounded bg-gray/15" />
              <div className="h-4 w-1/3 rounded bg-gray/10" />
            </div>
          ))}
        </div>
        <span className="sr-only">Loading photos…</span>
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

  return (
    <div className="max-w-wide mx-auto px-6 py-12">
      {heading && (
        <div className="mb-8 flex flex-wrap items-baseline gap-3">
          <h2 className="font-serif text-2xl text-charcoal">
            Tagged: <span className="text-accent">{heading}</span>
          </h2>
          <a
            href="/photos"
            onClick={clearTagFilter}
            className="text-sm text-gray underline hover:text-charcoal"
          >
            Clear filter
          </a>
        </div>
      )}

      {items.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-gray text-lg mb-4">
            {heading
              ? `No photos tagged “${heading}”.`
              : "No photos yet. Check back soon!"}
          </p>
          {heading && (
            <Link href="/photos" className="text-charcoal underline hover:text-accent">
              View all photos
            </Link>
          )}
        </div>
      ) : (
        <>
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

          {cursor && !tag && (
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
        </>
      )}
    </div>
  );
}
