"use client";

import { Dialog, DialogPanel } from "@headlessui/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import type { Post } from "@/lib/content";
import {
  prefetchPhotosForSearch,
  photoIdString,
  type PublicPhoto,
} from "@/lib/photos-api";

const CDN_BASE = process.env.NEXT_PUBLIC_CDN_URL || "";

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
}

type SearchHit =
  | { kind: "post"; post: Post }
  | { kind: "photo"; photo: PublicPhoto };

export default function SearchBar({ isOpen, onClose }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [allPhotos, setAllPhotos] = useState<PublicPhoto[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    if (allPosts.length === 0) {
      fetch("/posts.json")
        .then((res) => res.json())
        .then((posts) => setAllPosts(posts))
        .catch(() => {});
    }

    if (allPhotos.length === 0 && process.env.NEXT_PUBLIC_PHOTO_API_URL) {
      prefetchPhotosForSearch(100)
        .then(setAllPhotos)
        .catch(() => {});
    }
  }, [isOpen, allPosts.length, allPhotos.length]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean);

    const postHits: SearchHit[] = allPosts
      .filter((post) => {
        const searchableText = `
          ${post.title}
          ${post.excerpt}
          ${post.tags.join(" ")}
          ${post.category}
        `.toLowerCase();
        return searchTerms.every((term) => searchableText.includes(term));
      })
      .filter((post) => post.type !== "photo")
      .slice(0, 8)
      .map((post) => ({ kind: "post" as const, post }));

    const photoHits: SearchHit[] = allPhotos
      .filter((photo) => {
        const searchableText = `
          ${photo.title}
          ${photo.caption || ""}
          ${(photo.tags || []).join(" ")}
          ${photo.city || ""}
          ${photo.country || ""}
        `.toLowerCase();
        return searchTerms.every((term) => searchableText.includes(term));
      })
      .slice(0, 8)
      .map((photo) => ({ kind: "photo" as const, photo }));

    setResults([...photoHits, ...postHits].slice(0, 12));
  }, [query, allPosts, allPhotos]);

  const handleClose = () => {
    setQuery("");
    setResults([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-charcoal/50 backdrop-blur-sm" />

      <div className="fixed inset-0 flex items-start justify-center p-4 pt-20">
        <DialogPanel className="w-full max-w-2xl bg-cream rounded-lg shadow-xl">
          <div className="p-4 border-b border-charcoal/10">
            <div className="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 text-gray"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search posts and photos..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-charcoal placeholder-gray outline-none text-lg"
                autoFocus
              />
              <button
                onClick={handleClose}
                className="text-gray hover:text-charcoal transition-colors"
                aria-label="Close search"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {query && results.length === 0 && (
              <div className="p-8 text-center text-gray">
                No results for &ldquo;{query}&rdquo;
              </div>
            )}

            {results.length > 0 && (
              <div className="divide-y divide-charcoal/10">
                {results.map((hit) =>
                  hit.kind === "photo" ? (
                    <Link
                      key={`photo-${photoIdString(hit.photo)}`}
                      href={`/photos/${photoIdString(hit.photo)}`}
                      onClick={handleClose}
                      className="block p-4 hover:bg-charcoal/5 transition-colors no-underline"
                    >
                      <div className="mb-1">
                        <span className="inline-block px-2 py-0.5 text-xs font-semibold tracking-wide uppercase bg-charcoal text-cream rounded">
                          Photo
                        </span>
                      </div>
                      <h3 className="text-lg font-serif font-semibold text-charcoal mb-1">
                        {hit.photo.title}
                      </h3>
                      {hit.photo.caption && (
                        <p className="text-sm text-gray line-clamp-2">
                          {hit.photo.caption}
                        </p>
                      )}
                    </Link>
                  ) : (
                    <Link
                      key={`post-${hit.post.slug}`}
                      href={`/posts/${hit.post.slug}`}
                      onClick={handleClose}
                      className="block p-4 hover:bg-charcoal/5 transition-colors no-underline"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="mb-1">
                            <span className="inline-block px-2 py-0.5 text-xs font-semibold tracking-wide uppercase bg-charcoal text-cream rounded">
                              {hit.post.category}
                            </span>
                          </div>
                          <h3 className="text-lg font-serif font-semibold text-charcoal mb-1">
                            {hit.post.title}
                          </h3>
                          <p className="text-sm text-gray line-clamp-2">
                            {hit.post.excerpt}
                          </p>
                        </div>
                        {hit.post.thumbnailUrl && (
                          <div className="flex-shrink-0 w-16 h-16 rounded overflow-hidden bg-gray/10">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`${CDN_BASE}${hit.post.thumbnailUrl}`}
                              alt=""
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        )}
                      </div>
                    </Link>
                  ),
                )}
              </div>
            )}

            {!query && (
              <div className="p-8 text-center text-gray">
                Start typing to search posts and photos...
              </div>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
