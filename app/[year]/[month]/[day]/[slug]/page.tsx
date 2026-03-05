import { redirect } from "next/navigation";
import { getAllPostDateSlugs } from "@/lib/content";

interface Props {
  params: Promise<{
    year: string;
    month: string;
    day: string;
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return getAllPostDateSlugs();
}

export default async function DateSlugRedirectPage({ params }: Props) {
  const { slug } = await params;
  redirect(`/posts/${slug}`);
}
