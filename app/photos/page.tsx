import { getPhotos } from "@/lib/content";
import PostGrid from "@/components/PostGrid";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Photos - Micah Walter",
  description: "A collection of photos from my travels and daily life.",
  openGraph: {
    title: "Photos - Micah Walter",
    description: "A collection of photos from my travels and daily life.",
  },
};

export default function PhotosPage() {
  const photos = getPhotos();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="max-w-wide mx-auto px-6 py-12 border-b border-gray/20">
        <h1 className="font-serif font-semibold text-4xl md:text-5xl mb-4 text-charcoal">
          Photos
        </h1>
        <p className="text-lg text-gray max-w-reading">
          A collection of moments captured through the lens. Each photo tells a story.
        </p>
      </header>

      {/* Photo Grid */}
      {photos.length > 0 ? (
        <PostGrid posts={photos} featuredFirst={false} />
      ) : (
        <div className="max-w-wide mx-auto px-6 py-24 text-center">
          <p className="text-gray text-lg">No photos yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
}
