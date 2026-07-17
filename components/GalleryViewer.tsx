"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { format } from "date-fns";
import type { Post } from "@/lib/content";

const CDN = process.env.NEXT_PUBLIC_CDN_URL || "";

function base(post: Post) {
  const filename = post.coverImage
    ? post.coverImage.replace(/^\.\//, "").replace(/\.(jpg|jpeg|png)$/i, "")
    : "photo";
  return `/images/posts/${post.folderName}/${filename}`;
}

function exifLine(photo: Post) {
  return [
    photo.camera,
    photo.aperture,
    photo.shutterSpeed,
    photo.iso ? `ISO ${photo.iso}` : null,
    photo.focalLength,
  ]
    .filter(Boolean)
    .join(" · ");
}

interface Props {
  photos: Post[];
}

export default function GalleryViewer({ photos }: Props) {
  const [index, setIndex] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen();
    setIndex(null);
  }, []);
  const prev = useCallback(
    () => setIndex((i) => (i !== null && i > 0 ? i - 1 : i)),
    []
  );
  const next = useCallback(
    () => setIndex((i) => (i !== null && i < photos.length - 1 ? i + 1 : i)),
    [photos.length]
  );
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      lightboxRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    if (index === null) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.fullscreenElement) close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "f" || e.key === "F") toggleFullscreen();
    };
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("keydown", handle);
    document.addEventListener("fullscreenchange", onFsChange);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handle);
      document.removeEventListener("fullscreenchange", onFsChange);
      document.body.style.overflow = "";
    };
  }, [index, close, prev, next, toggleFullscreen]);

  // Keep active thumbnail scrolled into view
  useEffect(() => {
    if (index === null || !thumbsRef.current) return;
    const thumb = thumbsRef.current.children[index] as HTMLElement | undefined;
    thumb?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [index]);

  const current = index !== null ? photos[index] : null;

  return (
    <>
      {/* ── Grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {photos.map((photo, i) => {
          const src = base(photo);
          const exif = exifLine(photo);

          return (
            <article key={photo.slug} className="group">
              {/* Image — opens lightbox */}
              <button
                className="w-full text-left mb-3 relative overflow-hidden rounded-lg cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                onClick={() => setIndex(i)}
                aria-label={`Open ${photo.title} in viewer`}
              >
                {photo.coverImage ? (
                  <picture>
                    <source
                      srcSet={`${CDN}${src}-400.webp 400w,${CDN}${src}-800.webp 800w,${CDN}${src}-1200.webp 1200w`}
                      type="image/webp"
                      sizes="(max-width: 640px) 100vw,(max-width: 1024px) 400px,500px"
                    />
                    <source
                      srcSet={`${CDN}${src}-400.jpg 400w,${CDN}${src}-800.jpg 800w,${CDN}${src}-1200.jpg 1200w`}
                      type="image/jpeg"
                      sizes="(max-width: 640px) 100vw,(max-width: 1024px) 400px,500px"
                    />
                    <img
                      src={`${CDN}${src}-800.jpg`}
                      alt={photo.title}
                      loading="lazy"
                      style={{ width: "100%", height: "auto" }}
                      className="transition-transform duration-300 group-hover:scale-105"
                    />
                  </picture>
                ) : (
                  <div className="aspect-square bg-gradient-to-br from-accent/20 to-gray/10 flex items-center justify-center">
                    <span className="text-5xl">📷</span>
                  </div>
                )}

                {exif && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-charcoal/90 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-lg">
                    <p className="text-xs text-cream/80 font-mono">{exif}</p>
                  </div>
                )}
              </button>

              {/* Metadata row */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-serif font-medium text-charcoal truncate">
                    {photo.title}
                  </p>
                  {photo.location && (
                    <p className="text-xs text-gray mt-0.5 truncate">{photo.location}</p>
                  )}
                  {photo.dateTaken && (
                    <p className="text-xs text-gray/60 mt-0.5">
                      {format(new Date(photo.dateTaken), "MMMM d, yyyy")}
                    </p>
                  )}
                </div>
                <Link
                  href={`/photos/${photo.id || photo.slug}`}
                  className="flex-shrink-0 text-xs text-gray border border-gray/30 rounded px-2 py-1 no-underline hover:border-gray hover:bg-gray/10 transition-colors whitespace-nowrap"
                >
                  View →
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      {/* ── Lightbox ───────────────────────────────────────────────── */}
      {index !== null && current && (
        <div ref={lightboxRef} className="fixed inset-0 z-50 flex flex-col bg-charcoal/[0.97]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
            <div className="min-w-0 mr-4">
              <span className="font-serif text-lg text-cream leading-tight">
                {current.title}
              </span>
              <span className="ml-3 text-sm text-cream/40 tabular-nums">
                {index + 1} / {photos.length}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={toggleFullscreen}
                className="w-9 h-9 flex items-center justify-center rounded-full text-cream/60 hover:text-cream hover:bg-cream/10 transition-colors"
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                title={isFullscreen ? "Exit fullscreen (F)" : "Fullscreen (F)"}
              >
                {isFullscreen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                  </svg>
                )}
              </button>
              <button
                onClick={close}
                className="w-9 h-9 flex items-center justify-center rounded-full text-cream/60 hover:text-cream hover:bg-cream/10 transition-colors text-2xl font-light"
                aria-label="Close viewer"
              >
                ×
              </button>
            </div>
          </div>

          {/* Image + arrows */}
          <div className="flex flex-1 items-center min-h-0 gap-2 px-4">
            <button
              onClick={prev}
              disabled={index === 0}
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-cream/10 hover:bg-cream/20 text-cream disabled:opacity-20 transition-colors text-xl"
              aria-label="Previous photo"
            >
              ‹
            </button>

            <div className="flex-1 flex items-center justify-center min-h-0">
              {current.coverImage && (
                <picture>
                  <source
                    srcSet={`${CDN}${base(current)}-400.webp 400w,${CDN}${base(current)}-800.webp 800w,${CDN}${base(current)}-1200.webp 1200w`}
                    type="image/webp"
                    sizes="90vw"
                  />
                  <source
                    srcSet={`${CDN}${base(current)}-400.jpg 400w,${CDN}${base(current)}-800.jpg 800w,${CDN}${base(current)}-1200.jpg 1200w`}
                    type="image/jpeg"
                    sizes="90vw"
                  />
                  <img
                    src={`${CDN}${base(current)}-1200.jpg`}
                    alt={current.title}
                    className="max-h-[calc(100vh-220px)] max-w-full object-contain rounded-lg shadow-2xl"
                  />
                </picture>
              )}
            </div>

            <button
              onClick={next}
              disabled={index === photos.length - 1}
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-cream/10 hover:bg-cream/20 text-cream disabled:opacity-20 transition-colors text-xl"
              aria-label="Next photo"
            >
              ›
            </button>
          </div>

          {/* EXIF line */}
          <div className="flex-shrink-0 text-center py-2">
            <p className="text-xs text-cream/30 font-mono">{exifLine(current)}</p>
          </div>

          {/* Thumbnail strip */}
          <div
            ref={thumbsRef}
            className="flex gap-2 overflow-x-auto px-6 pb-5 pt-1 flex-shrink-0"
            style={{ scrollbarWidth: "none" }}
          >
            {photos.map((photo, i) => (
              <button
                key={photo.slug}
                onClick={() => setIndex(i)}
                aria-label={`Go to ${photo.title}`}
                className={`flex-shrink-0 w-14 h-14 rounded overflow-hidden transition-all duration-150 ${
                  i === index
                    ? "ring-2 ring-accent opacity-100 scale-105"
                    : "opacity-40 hover:opacity-70"
                }`}
              >
                <img
                  src={`${CDN}${base(photo)}-400.webp`}
                  alt={photo.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
