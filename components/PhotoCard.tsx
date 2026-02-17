import Link from "next/link";
import { format } from "date-fns";
import type { Post } from "@/lib/content";
import { CoverImage } from "./ResponsiveImage";

interface PhotoCardProps {
  post: Post;
}

export default function PhotoCard({ post }: PhotoCardProps) {
  const formattedDate = format(new Date(post.publishedAt), "MMMM d, yyyy");

  // Extract filename from coverImage path (e.g., "./photo.jpg" -> "photo")
  const coverFilename = post.coverImage
    ? post.coverImage.replace(/^\.\//, '').replace(/\.(jpg|jpeg|png)$/i, '')
    : 'photo';

  // Build EXIF summary for hover
  const exifSummary = [
    post.camera,
    post.aperture,
    post.shutterSpeed,
    post.iso ? `ISO ${post.iso}` : null,
  ]
    .filter(Boolean)
    .slice(0, 2) // Show first 2 items
    .join(' • ');

  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group block no-underline"
    >
      <article className="h-full transition-transform duration-200 hover:-translate-y-1">
        {/* Photo - 4:3 aspect ratio with object-contain to show full image */}
        {post.coverImage ? (
          <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-gray/10 mb-4 relative flex items-center justify-center">
            <CoverImage
              folderName={post.folderName}
              filename={coverFilename}
              alt={post.title}
              className="object-contain max-h-full max-w-full transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 400px, 500px"
            />

            {/* Photo badge overlay */}
            <div className="absolute top-3 right-3">
              <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wide uppercase bg-charcoal/80 text-cream rounded-full backdrop-blur-sm">
                📷 Photo
              </span>
            </div>

            {/* EXIF overlay on hover */}
            {exifSummary && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-charcoal/90 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-xs text-cream/80 font-mono">
                  {exifSummary}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-[4/3] w-full rounded-lg bg-gradient-to-br from-accent/20 to-gray/10 mb-4 flex items-center justify-center">
            <span className="text-6xl">📷</span>
          </div>
        )}

        {/* Content */}
        <div>
          {/* Category Tag & Draft Badge */}
          <div className="mb-2 flex items-center gap-2">
            <Link
              href={`/topics/${post.category.toLowerCase()}`}
              className="inline-block px-3 py-1 text-xs font-semibold tracking-wide uppercase bg-charcoal text-cream rounded-full no-underline hover:bg-charcoal/80 transition-colors"
            >
              {post.category}
            </Link>
            {post.draft && process.env.NODE_ENV === 'development' && (
              <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wide uppercase bg-accent/80 text-charcoal rounded-full">
                DRAFT
              </span>
            )}
          </div>

          {/* Title */}
          <h2 className="font-serif font-semibold text-xl md:text-2xl mb-2 text-charcoal group-hover:text-gray transition-colors">
            {post.title}
          </h2>

          {/* Date */}
          <time className="block text-sm text-gray mb-2">
            {formattedDate}
          </time>

          {/* Camera info */}
          {post.camera && (
            <p className="text-sm text-gray/80 mb-3">
              {post.camera}
            </p>
          )}

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-base text-charcoal/80 leading-relaxed line-clamp-2 mb-3">
              {post.excerpt}
            </p>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.slice(0, 4).map((tag) => (
                <Link
                  key={tag}
                  href={`/tags/${encodeURIComponent(tag.toLowerCase())}`}
                  className="text-xs text-gray border border-gray/30 rounded px-2 py-1 no-underline hover:border-gray hover:bg-gray/10 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
