import { redirect } from "next/navigation";
import { getPostsByYearMonth, getAllYearMonths } from "@/lib/content";
import PostGrid from "@/components/PostGrid";
import type { Metadata } from "next";

interface MonthPageProps {
  params: Promise<{
    year: string;
    month: string;
  }>;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function isValidMonth(month: string): boolean {
  const n = parseInt(month, 10);
  return /^\d{2}$/.test(month) && n >= 1 && n <= 12;
}

export async function generateStaticParams() {
  return getAllYearMonths().map(({ year, month }) => ({ year, month }));
}

export async function generateMetadata({ params }: MonthPageProps): Promise<Metadata> {
  const { year, month } = await params;
  if (!isValidMonth(month)) {
    return {};
  }
  const monthName = MONTH_NAMES[parseInt(month, 10) - 1];
  return {
    title: `Posts from ${monthName} ${year}`,
    description: `Browse all posts published in ${monthName} ${year}`,
  };
}

export default async function MonthArchivePage({ params }: MonthPageProps) {
  const { year, month } = await params;

  if (!isValidMonth(month)) {
    redirect(`/posts/${month}`);
  }

  const monthName = MONTH_NAMES[parseInt(month, 10) - 1];
  const posts = getPostsByYearMonth(year, month);

  return (
    <>
      <div className="max-w-wide mx-auto px-6 pt-12 pb-6">
        <h1 className="text-4xl md:text-5xl font-serif font-semibold text-charcoal mb-4">
          {monthName} {year}
        </h1>
        <p className="text-lg text-gray">
          {posts.length} {posts.length === 1 ? "post" : "posts"}
        </p>
      </div>
      {posts.length > 0 ? (
        <PostGrid posts={posts} />
      ) : (
        <div className="max-w-wide mx-auto px-6 py-12">
          <p className="text-lg text-gray">No posts published in {monthName} {year}.</p>
        </div>
      )}
    </>
  );
}
