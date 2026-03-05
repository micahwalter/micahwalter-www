import { redirect } from "next/navigation";
import { getAllPostYearMonthSlugs } from "@/lib/content";

interface Props {
  params: Promise<{
    year: string;
    month: string;
    day: string; // used as slug when path is /YYYY/MM/slug
  }>;
}

export async function generateStaticParams() {
  return getAllPostYearMonthSlugs().map(({ year, month, slug }) => ({
    year,
    month,
    day: slug,
  }));
}

export default async function YearMonthSlugRedirectPage({ params }: Props) {
  const { day: slug } = await params;
  redirect(`/posts/${slug}`);
}
