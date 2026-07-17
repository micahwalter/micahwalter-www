import ApiPhotoDetail from "@/components/ApiPhotoDetail";
import type { Metadata } from "next";

interface PhotoPageProps {
  params: Promise<{ id: string }>;
}

/** Placeholder for static export; CF rewrites /photos/<digits> → this shell. */
export function generateStaticParams() {
  return [{ id: "0" }];
}

export const metadata: Metadata = {
  title: "Photo - Micah Walter",
  description: "A photograph from Micah Walter.",
};

export default async function PhotoDetailPage({ params }: PhotoPageProps) {
  const { id } = await params;
  return <ApiPhotoDetail idHint={id} />;
}
