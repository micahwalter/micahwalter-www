import { format } from "date-fns";
import type { Post } from "@/lib/content";

interface PostLayoutProps {
  post: Post;
  children: React.ReactNode;
}

export default function PostLayout({ post, children }: PostLayoutProps) {
  const formattedDate = format(new Date(post.publishedAt), "MMMM d, yyyy");

  return (
    <article className="max-w-reading mx-auto px-6 py-12">
      {/* Header */}
      <header className="mb-12">
        {/* Category */}
        <div className="mb-4">
          <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wide uppercase bg-charcoal text-cream rounded-full">
            {post.category}
          </span>
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
                  <span
                    key={tag}
                    className="text-xs border border-gray/30 rounded px-2 py-1"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </header>

      {/* Featured Image */}
      {post.coverImage && (
        <div className="mb-12 -mx-6 md:mx-0">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full rounded-lg"
          />
        </div>
      )}

      {/* Content */}
      <div className="prose prose-lg max-w-none">{children}</div>
    </article>
  );
}
