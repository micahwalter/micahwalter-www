import Link from "next/link";
import { format } from "date-fns";
import type { Post } from "@/lib/content";

interface PostCardProps {
  post: Post;
  featured?: boolean;
}

export default function PostCard({ post, featured = false }: PostCardProps) {
  const formattedDate = format(new Date(post.publishedAt), "MMMM d, yyyy");

  return (
    <Link
      href={`/posts/${post.slug}`}
      className={`group block no-underline ${
        featured ? "mb-12" : ""
      }`}
    >
      <article className="h-full transition-transform duration-200 hover:-translate-y-1">
        {/* Thumbnail */}
        {post.coverImage ? (
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-gray/10 mb-4">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="aspect-video w-full rounded-lg bg-gradient-to-br from-accent/20 to-gray/10 mb-4 flex items-center justify-center">
            <span className="text-6xl text-gray/30">
              {post.title.charAt(0)}
            </span>
          </div>
        )}

        {/* Content */}
        <div>
          {/* Category Tag */}
          <div className="mb-2">
            <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wide uppercase bg-charcoal text-cream rounded-full">
              {post.category}
            </span>
          </div>

          {/* Title */}
          <h2
            className={`font-serif font-semibold mb-2 text-charcoal group-hover:text-gray transition-colors ${
              featured ? "text-3xl md:text-4xl" : "text-xl md:text-2xl"
            }`}
          >
            {post.title}
          </h2>

          {/* Date */}
          <time className="block text-sm text-gray mb-3">
            {formattedDate}
          </time>

          {/* Excerpt */}
          <p
            className={`text-charcoal/80 leading-relaxed ${
              featured ? "text-lg" : "text-base"
            }`}
          >
            {post.excerpt}
          </p>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-gray border border-gray/30 rounded px-2 py-1"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
