import { getBlogPosts } from "@/lib/content";
import HomePhotos from "@/components/HomePhotos";
import type { Metadata } from "next";
import { withSocial } from "@/lib/seo";

export const metadata: Metadata = {
  ...withSocial({
    title: "Micah Walter",
    description: "Investigations in AI, Cloud, and Creativity",
    path: "/",
  }),
  title: { absolute: "Micah Walter" },
};

export default function Home() {
  const recentPosts = getBlogPosts()
    .slice(0, 5)
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      publishedAt: p.publishedAt,
    }));

  return (
    <main className="max-w-wide mx-auto px-6 py-12">
      <HomePhotos recentPosts={recentPosts} />
    </main>
  );
}
