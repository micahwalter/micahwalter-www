import ApiGalleryDetail from "@/components/ApiGalleryDetail";
import type { Metadata } from "next";
import { withSocial } from "@/lib/seo";

interface GalleryPageProps {
  params: Promise<{ slug: string }>;
}

/** Placeholder for static export; CF rewrites /galleries/<slug> → this shell. */
export function generateStaticParams() {
  return [{ slug: "_placeholder" }];
}

export const metadata: Metadata = withSocial({
  title: "Gallery",
  description: "A photo gallery from Micah Walter.",
  path: "/galleries",
});

export default async function GalleryPage({ params }: GalleryPageProps) {
  const { slug } = await params;
  return <ApiGalleryDetail slugHint={slug} />;
}
