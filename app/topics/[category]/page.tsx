import { notFound } from "next/navigation";
import { getPostsByCategory, getAllCategories } from "@/lib/content";
import PostGrid from "@/components/PostGrid";
import type { Metadata } from "next";
import { withSocial } from "@/lib/seo";

interface CategoryPageProps {
  params: Promise<{
    category: string;
  }>;
}

export async function generateStaticParams() {
  const categories = getAllCategories();
  return categories.map((category) => ({
    category: category.toLowerCase(),
  }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const categoryName = category.toUpperCase();

  return withSocial({
    title: `${categoryName} Posts`,
    description: `Browse all posts about ${categoryName}`,
    path: `/topics/${category}`,
  });
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const posts = getPostsByCategory(category);

  if (posts.length === 0) {
    notFound();
  }

  const categoryName = category.toUpperCase();

  return (
    <>
      <div className="max-w-wide mx-auto px-6 pt-12 pb-6">
        <h1 className="text-4xl md:text-5xl font-serif font-semibold text-charcoal mb-4">
          {categoryName}
        </h1>
        <p className="text-lg text-gray">
          {posts.length} {posts.length === 1 ? "post" : "posts"}
        </p>
      </div>
      <PostGrid posts={posts} />
    </>
  );
}
