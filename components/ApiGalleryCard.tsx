"use client";

import Link from "next/link";
import { format } from "date-fns";
import type { PublicGallery, PublicPhoto } from "@/lib/photos-api";
import { CoverImage } from "./ResponsiveImage";

interface ApiGalleryCardProps {
  gallery: PublicGallery;
  cover: PublicPhoto | null;
  coverFilename: string;
}

export default function ApiGalleryCard({
  gallery,
  cover,
  coverFilename,
}: ApiGalleryCardProps) {
  const formattedDate = gallery.publishedAt
    ? format(new Date(gallery.publishedAt), "MMMM d, yyyy")
    : "";

  return (
    <Link href={`/galleries/${gallery.slug}`} className="group block no-underline">
      <article className="h-full transition-transform duration-200 hover:-translate-y-1">
        {cover ? (
          <div className="w-full mb-4 relative overflow-hidden rounded-lg">
            <CoverImage
              folderName={cover.folderName}
              filename={coverFilename}
              alt={gallery.title}
              className="w-full h-auto transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 400px, 500px"
            />
            <div className="absolute bottom-3 right-3">
              <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wide uppercase bg-charcoal/80 text-cream rounded-full backdrop-blur-sm">
                {(gallery.photoIds || []).length} photos
              </span>
            </div>
          </div>
        ) : (
          <div className="aspect-video w-full rounded-lg bg-gradient-to-br from-accent/20 to-gray/10 mb-4" />
        )}

        <h2 className="font-serif font-semibold text-xl md:text-2xl mb-1 text-charcoal group-hover:text-gray transition-colors">
          {gallery.title}
        </h2>
        {formattedDate && (
          <time className="block text-sm text-gray mb-2">{formattedDate}</time>
        )}
        {gallery.description && (
          <p className="text-gray text-sm line-clamp-2">{gallery.description}</p>
        )}
      </article>
    </Link>
  );
}
