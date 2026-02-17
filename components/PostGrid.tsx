import PostCard from "./PostCard";
import PhotoCard from "./PhotoCard";
import type { Post } from "@/lib/content";

interface PostGridProps {
  posts: Post[];
  featuredFirst?: boolean;
}

export default function PostGrid({
  posts,
  featuredFirst = false,
}: PostGridProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray text-lg">No posts found.</p>
      </div>
    );
  }

  const [firstPost, ...restPosts] = posts;

  // Only show featured layout for blog posts, not photos
  const shouldShowFeatured = featuredFirst && firstPost && firstPost.type !== 'photo';

  return (
    <div className="max-w-wide mx-auto px-6 py-12">
      {shouldShowFeatured && (
        <div className="mb-16">
          <PostCard post={firstPost} featured />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {(shouldShowFeatured ? restPosts : posts).map((post) => {
          // Use PhotoCard for photo posts, PostCard for blog posts
          if (post.type === 'photo') {
            return <PhotoCard key={post.slug} post={post} />;
          }
          return <PostCard key={post.slug} post={post} />;
        })}
      </div>
    </div>
  );
}
