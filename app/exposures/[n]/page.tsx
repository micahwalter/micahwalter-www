import ExposureDetail from "@/components/ExposureDetail";
import type { Metadata } from "next";

interface ExposurePageProps {
  params: Promise<{ n: string }>;
}

/** Placeholder for static export; client reads real n from the path. */
export function generateStaticParams() {
  return [{ n: "0" }];
}

export const metadata: Metadata = {
  title: "Exposure - Micah Walter",
  description: "A photograph from the Exposure series.",
};

export default async function ExposureIssuePage({ params }: ExposurePageProps) {
  const { n } = await params;
  return <ExposureDetail nHint={n} />;
}
