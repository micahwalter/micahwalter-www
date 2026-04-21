import Link from "next/link";
import { format } from "date-fns";
import type { Gallery } from "@/lib/galleries";
import type { Post } from "@/lib/content";
import { CoverImage } from "./ResponsiveImage";

interface GalleryCardProps {
  gallery: Gallery;
  coverPost: Post | undefined;
}

export default function GalleryCard({ gallery, coverPost }: GalleryCardProps) {
  const formattedDate = format(new Date(gallery.publishedAt), "MMMM d, yyyy");

  const coverFilename = coverPost?.coverImage
    ? coverPost.coverImage.replace(/^\.\//, "").replace(/\.(jpg|jpeg|png)$/i, "")
    : "photo";

  return (
    <Link href={`/galleries/${gallery.slug}`} className="group block no-underline">
      <article className="h-full transition-transform duration-200 hover:-translate-y-1">
        {/* Cover image */}
        {coverPost ? (
          <div className="w-full mb-4 relative overflow-hidden rounded-lg">
            <CoverImage
              folderName={coverPost.folderName}
              filename={coverFilename}
              alt={gallery.title}
              className="w-full h-auto transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 400px, 500px"
            />
            {/* Photo count badge */}
            <div className="absolute bottom-3 right-3">
              <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wide uppercase bg-charcoal/80 text-cream rounded-full backdrop-blur-sm">
                {gallery.photoIds.length} photos
              </span>
            </div>
          </div>
        ) : (
          <div className="aspect-video w-full rounded-lg bg-gradient-to-br from-accent/20 to-gray/10 mb-4 flex items-center justify-center">
            <span className="text-5xl">🖼</span>
          </div>
        )}

        {/* Text */}
        <h2 className="font-serif font-semibold text-xl md:text-2xl mb-1 text-charcoal group-hover:text-gray transition-colors">
          {gallery.title}
        </h2>
        <time className="block text-sm text-gray mb-2">{formattedDate}</time>
        {gallery.description && (
          <p className="text-base text-charcoal/80 leading-relaxed line-clamp-2">
            {gallery.description}
          </p>
        )}
      </article>
    </Link>
  );
}
