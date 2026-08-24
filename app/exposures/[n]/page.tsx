import Link from "next/link";
import ExposureDetail from "@/components/ExposureDetail";
import ExposuresIntro from "@/components/ExposuresIntro";
import type { Metadata } from "next";
import { withSocial } from "@/lib/seo";

interface ExposurePageProps {
  params: Promise<{ n: string }>;
}

/** Placeholder for static export; client reads real n from the path. */
export function generateStaticParams() {
  return [{ n: "0" }];
}

export const metadata: Metadata = withSocial({
  title: "Exposure",
  description:
    "A photograph from the Exposure series — one photo and a few words, sent most Sundays.",
  path: "/exposures",
});

export default async function ExposureIssuePage({ params }: ExposurePageProps) {
  const { n } = await params;
  return (
    <div className="min-h-screen">
      <header className="max-w-wide mx-auto px-6 pt-12 pb-6 border-b border-gray/20">
        <p className="font-serif text-2xl text-charcoal mb-3">
          <Link href="/exposures" className="hover:text-accent transition-colors no-underline">
            Exposures
          </Link>
        </p>
        <ExposuresIntro />
      </header>
      <ExposureDetail nHint={n} />
    </div>
  );
}
