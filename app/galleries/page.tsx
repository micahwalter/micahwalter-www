import { getAllGalleries, getGalleryPhotos } from "@/lib/galleries";
import GalleryCard from "@/components/GalleryCard";
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
  const galleries = getAllGalleries();

  const galleriesWithCovers = galleries.map((gallery) => {
    const photos = getGalleryPhotos(gallery);
    const coverPost =
      gallery.coverPhoto !== undefined
        ? photos.find((p) => Number(p.id) === gallery.coverPhoto) ?? photos[0]
        : photos[0];
    return { gallery, coverPost };
  });

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

      {galleriesWithCovers.length > 0 ? (
        <div className="max-w-wide mx-auto px-6 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {galleriesWithCovers.map(({ gallery, coverPost }) => (
              <GalleryCard key={gallery.slug} gallery={gallery} coverPost={coverPost} />
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-wide mx-auto px-6 py-24 text-center">
          <p className="text-gray text-lg">No galleries yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
}
