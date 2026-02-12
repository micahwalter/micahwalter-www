import { notFound } from "next/navigation";
import { getPostsByTag, getAllTags } from "@/lib/content";
import PostGrid from "@/components/PostGrid";
import type { Metadata } from "next";

interface TagPageProps {
  params: Promise<{
    tag: string;
  }>;
}

export async function generateStaticParams() {
  const tags = getAllTags();
  return tags.map((tag) => ({
    tag: tag.toLowerCase().replace(/\s+/g, "-"),
  }));
}

export async function generateMetadata({
  params,
}: TagPageProps): Promise<Metadata> {
  const { tag } = await params;
  const tagName = tag.replace(/-/g, " ");

  return {
    title: `Posts tagged "${tagName}"`,
    description: `Browse all posts tagged with ${tagName}`,
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params;
  const tagName = tag.replace(/-/g, " ");
  const posts = getPostsByTag(tagName);

  if (posts.length === 0) {
    notFound();
  }

  return (
    <>
      <div className="max-w-wide mx-auto px-6 pt-12 pb-6">
        <h1 className="text-4xl md:text-5xl font-serif font-semibold text-charcoal mb-4">
          Posts tagged &ldquo;{tagName}&rdquo;
        </h1>
        <p className="text-lg text-gray">
          {posts.length} {posts.length === 1 ? "post" : "posts"}
        </p>
      </div>
      <PostGrid posts={posts} />
    </>
  );
}
