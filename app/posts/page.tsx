import type { Metadata } from "next";
import { getBlogPosts } from "@/lib/content";
import PaginatedPostGrid from "@/components/PaginatedPostGrid";
import { postCoverOgImage, withSocial } from "@/lib/seo";

const firstCovered = getBlogPosts().find((p) => p.coverImage);

export const metadata: Metadata = withSocial({
  title: "Posts",
  description: "All blog posts.",
  path: "/posts",
  image: firstCovered ? postCoverOgImage(firstCovered) : undefined,
});

const POSTS_PER_PAGE = 12;

export default function PostsPage() {
  const posts = getBlogPosts();

  return (
    <div className="min-h-screen">
      <header className="max-w-wide mx-auto px-6 py-12 border-b border-gray/20">
        <h1 className="font-serif font-semibold text-4xl md:text-5xl mb-4 text-charcoal">
          Posts
        </h1>
        <p className="text-lg text-gray max-w-reading">
          All blog posts.
        </p>
      </header>

      {posts.length > 0 ? (
        <PaginatedPostGrid posts={posts} perPage={POSTS_PER_PAGE} />
      ) : (
        <div className="max-w-wide mx-auto px-6 py-24 text-center">
          <p className="text-gray text-lg">No posts yet.</p>
        </div>
      )}
    </div>
  );
}
