import { getPostsByYear, getAllYears } from "@/lib/content";
import PostGrid from "@/components/PostGrid";
import type { Metadata } from "next";

interface YearPageProps {
  params: Promise<{
    year: string;
  }>;
}

export async function generateStaticParams() {
  const years = getAllYears();
  return years.map((year) => ({ year }));
}

export async function generateMetadata({ params }: YearPageProps): Promise<Metadata> {
  const { year } = await params;
  return {
    title: `Posts from ${year}`,
    description: `Browse all posts published in ${year}`,
  };
}

export default async function YearArchivePage({ params }: YearPageProps) {
  const { year } = await params;
  const posts = getPostsByYear(year);

  return (
    <>
      <div className="max-w-wide mx-auto px-6 pt-12 pb-6">
        <h1 className="text-4xl md:text-5xl font-serif font-semibold text-charcoal mb-4">
          {year}
        </h1>
        <p className="text-lg text-gray">
          {posts.length} {posts.length === 1 ? "post" : "posts"}
        </p>
      </div>
      {posts.length > 0 ? (
        <PostGrid posts={posts} />
      ) : (
        <div className="max-w-wide mx-auto px-6 py-12">
          <p className="text-lg text-gray">No posts published in {year}.</p>
        </div>
      )}
    </>
  );
}
