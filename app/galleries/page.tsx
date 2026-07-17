import ApiGalleriesIndex from "@/components/ApiGalleriesIndex";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Galleries - Micah Walter",
  description: "Curated collections of photos.",
  openGraph: {
    title: "Galleries - Micah Walter",
    description: "Curated collections of photos.",
  },
};

export default function GalleriesPage() {
  return (
    <div className="min-h-screen">
      <header className="max-w-wide mx-auto px-6 py-12 border-b border-gray/20">
        <h1 className="font-serif font-semibold text-4xl md:text-5xl mb-4 text-charcoal">
          Galleries
        </h1>
        <p className="text-lg text-gray max-w-reading">
          Curated collections of photos, organized around themes and moments.
        </p>
      </header>

      <ApiGalleriesIndex />
    </div>
  );
}
