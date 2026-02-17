import Link from "next/link";
import { format } from "date-fns";
import type { Post } from "@/lib/content";
import { CoverImage } from "./ResponsiveImage";
import ExifDisplay from "./ExifDisplay";

interface PhotoLayoutProps {
  post: Post;
  children: React.ReactNode;
}

export default function PhotoLayout({ post, children }: PhotoLayoutProps) {
  const formattedDate = format(new Date(post.publishedAt), "MMMM d, yyyy");

  // Extract filename from coverImage path (e.g., "./photo.jpg" -> "photo")
  const coverFilename = post.coverImage
    ? post.coverImage.replace(/^\.\//, '').replace(/\.(jpg|jpeg|png)$/i, '')
    : 'photo';

  return (
    <article className="max-w-wide mx-auto px-6 py-12">
      {/* Header */}
      <header className="mb-8 max-w-reading mx-auto">
        {/* Category & Draft Badge */}
        <div className="mb-4 flex items-center gap-2">
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
        <h1 className="font-serif font-semibold text-4xl md:text-5xl mb-4 text-charcoal">
          {post.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-4 text-gray">
          <time dateTime={post.publishedAt}>{formattedDate}</time>
          {post.tags && post.tags.length > 0 && (
            <>
              <span>·</span>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/tags/${encodeURIComponent(tag.toLowerCase())}`}
                    className="text-xs text-gray border border-gray/30 rounded px-2 py-1 no-underline hover:border-gray hover:bg-gray/10 transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </header>

      {/* Photo - Full width within max-wide constraint */}
      {post.coverImage && (
        <div className="mb-8">
          <CoverImage
            folderName={post.folderName}
            filename={coverFilename}
            alt={post.title}
            className="rounded-lg"
            priority={true}
            sizes="(max-width: 768px) 100vw, 1340px"
            zoomable={true}
          />
        </div>
      )}

      {/* Two-column layout for description and EXIF */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-reading mx-auto">
        {/* Description/Content (2/3 width on desktop) */}
        <div className="md:col-span-2">
          <div className="prose prose-lg max-w-none">{children}</div>

          {/* Edit on GitHub */}
          <div className="mt-12 pt-6 border-t border-gray/20">
            <a
              href={`https://github.com/micahwalter/micahwalter-www/blob/main/content/posts/${post.folderName}/index.mdx`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray/60 hover:text-gray transition-colors no-underline"
            >
              Edit on GitHub →
            </a>
          </div>
        </div>

        {/* EXIF Sidebar (1/3 width on desktop) */}
        <aside className="md:col-span-1">
          <ExifDisplay post={post} />
        </aside>
      </div>
    </article>
  );
}
