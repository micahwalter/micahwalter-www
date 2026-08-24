import ExposuresGrid from "@/components/ExposuresGrid";
import ExposuresIntro from "@/components/ExposuresIntro";
import type { Metadata } from "next";
import { withSocial } from "@/lib/seo";

export const metadata: Metadata = withSocial({
  title: "Exposures",
  description:
    "A periodic photo newsletter — one photograph and a few words, sent most Sundays. Subscribe for the next issue.",
  path: "/exposures",
});

export default function ExposuresPage() {
  return (
    <div className="min-h-screen">
      <header className="max-w-wide mx-auto px-6 py-12 border-b border-gray/20">
        <h1 className="font-serif font-semibold text-4xl md:text-5xl mb-4 text-charcoal">
          Exposures
        </h1>
        <ExposuresIntro />
      </header>

      <ExposuresGrid />
    </div>
  );
}
