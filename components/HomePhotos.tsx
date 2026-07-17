"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  getFeaturedPhoto,
  listPhotos,
  photoCoverFilename,
  photoIdString,
  type PublicPhoto,
} from "@/lib/photos-api";
import { CoverImage } from "./ResponsiveImage";
import ApiPhotoMosaic from "./ApiPhotoMosaic";

export type HomeBlogPost = {
  slug: string;
  title: string;
  publishedAt: string;
};

type Status = "loading" | "ready" | "error";

interface HomePhotosProps {
  recentPosts: HomeBlogPost[];
}

export default function HomePhotos({ recentPosts }: HomePhotosProps) {
  const [status, setStatus] = useState<Status>("loading");
  const [featured, setFeatured] = useState<PublicPhoto | null>(null);
  const [recent, setRecent] = useState<PublicPhoto[]>([]);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const [feat, page] = await Promise.all([
        getFeaturedPhoto(),
        listPhotos({ limit: 12 }),
      ]);
      const featId = feat ? photoIdString(feat) : null;
      setFeatured(feat);
      setRecent(
        page.items.filter((p) => photoIdString(p) !== featId).slice(0, 6),
      );
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      {status === "loading" && (
        <div className="mb-8" aria-live="polite" aria-busy="true">
          <div className="w-full aspect-[3/2] max-h-[70vh] rounded-lg bg-gray/15 animate-pulse" />
          <span className="sr-only">Loading photos…</span>
        </div>
      )}

      {status === "error" && (
        <div className="mb-8">
          <p className="text-gray text-sm mb-3">Could not load photos.</p>
          <button
            type="button"
            onClick={load}
            className="text-sm text-charcoal underline hover:text-accent"
          >
            Retry
          </button>
        </div>
      )}

      {status === "ready" && featured?.folderName && (
        <Link
          href={`/photos/${photoIdString(featured)}`}
          className="block no-underline"
        >
          <CoverImage
            folderName={featured.folderName}
            filename={photoCoverFilename(featured)}
            alt={featured.title}
            className="rounded-lg"
            priority={true}
            sizes="(max-width: 768px) 100vw, 1340px"
            viewportFit={true}
          />
        </Link>
      )}

      {recentPosts.length > 0 && (
        <section className="mt-16 max-w-reading mx-auto">
          <h2 className="font-serif font-semibold text-2xl text-charcoal mb-6">
            Recent Posts
          </h2>
          <ul className="space-y-4">
            {recentPosts.map((p) => (
              <li key={p.slug} className="border-b border-gray/20 pb-4">
                <Link href={`/posts/${p.slug}`} className="group no-underline">
                  <span className="font-serif text-lg text-charcoal group-hover:text-accent transition-colors">
                    {p.title}
                  </span>
                  <span className="block text-sm text-gray mt-1">
                    {new Date(p.publishedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      timeZone: "UTC",
                    })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Link
              href="/posts"
              className="font-serif text-charcoal hover:text-accent transition-colors no-underline"
            >
              View all posts →
            </Link>
          </div>
        </section>
      )}

      {status === "ready" && recent.length > 0 && (
        <section className="mt-16 max-w-wide mx-auto">
          <h2 className="font-serif font-semibold text-2xl text-charcoal mb-6">
            Recent Photos
          </h2>
          <ApiPhotoMosaic photos={recent} />
          <div className="mt-8">
            <Link
              href="/photos"
              className="font-serif text-charcoal hover:text-accent transition-colors no-underline"
            >
              View all photos →
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
