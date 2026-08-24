import Link from "next/link";
import PhotosGrid from "@/components/PhotosGrid";
import type { Metadata } from "next";
import { withSocial } from "@/lib/seo";

export const metadata: Metadata = withSocial({
  title: "Photos",
  description: "A collection of photos from my travels and daily life.",
  path: "/photos",
});

export default function PhotosPage() {
  return (
    <div className="min-h-screen">
      <header className="max-w-wide mx-auto px-6 py-12 border-b border-gray/20">
        <h1 className="font-serif font-semibold text-4xl md:text-5xl mb-4 text-charcoal">
          Photos
        </h1>
        <p className="text-lg text-gray max-w-reading leading-relaxed">
          A collection of moments captured through the lens. Each photo tells a
          story. Some also appear in{" "}
          <Link
            href="/exposures"
            className="text-charcoal underline underline-offset-2 hover:text-accent transition-colors"
          >
            Exposure
          </Link>
          , a periodic photo newsletter sent most Sundays.
        </p>
      </header>

      <PhotosGrid />
    </div>
  );
}
