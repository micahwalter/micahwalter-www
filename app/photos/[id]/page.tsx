import ApiPhotoDetail from "@/components/ApiPhotoDetail";
import type { Metadata } from "next";
import { withSocial } from "@/lib/seo";

interface PhotoPageProps {
  params: Promise<{ id: string }>;
}

/** Placeholder for static export; CF rewrites /photos/<digits> → this shell. */
export function generateStaticParams() {
  return [{ id: "0" }];
}

export const metadata: Metadata = withSocial({
  title: "Photo",
  description: "A photograph from Micah Walter.",
  path: "/photos",
});

export default async function PhotoDetailPage({ params }: PhotoPageProps) {
  const { id } = await params;
  return <ApiPhotoDetail idHint={id} />;
}
