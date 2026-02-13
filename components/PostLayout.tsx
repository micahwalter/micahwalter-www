import Link from "next/link";
import { format } from "date-fns";
import type { Post } from "@/lib/content";
import { CoverImage } from "./ResponsiveImage";

interface PostLayoutProps {
  post: Post;
  children: React.ReactNode;
}

export default function PostLayout({ post, children }: PostLayoutProps) {
  const formattedDate = format(new Date(post.publishedAt), "MMMM d, yyyy");

  // Extract filename from coverImage path (e.g., "./cover2.jpg" -> "cover2")
  const coverFilename = post.coverImage
    ? post.coverImage.replace(/^\.\//, '').replace(/\.(jpg|jpeg|png)$/i, '')
    : 'cover';

  return (
    <article className="max-w-reading mx-auto px-6 py-12">
      {/* Header */}
      <header className="mb-12">
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
                    href={`/tags/${tag.toLowerCase().replace(/\s+/g, "-")}`}
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

      {/* Featured Image */}
      {post.coverImage && (
        <div className="mb-12 -mx-6 md:mx-0">
          <CoverImage
            folderName={post.folderName}
            filename={coverFilename}
            alt={post.title}
            className="rounded-lg"
            priority={true}
            sizes="(max-width: 768px) 100vw, 645px"
            zoomable={true}
          />
        </div>
      )}

      {/* Content */}
      <div className="prose prose-lg max-w-none">{children}</div>
    </article>
  );
}
