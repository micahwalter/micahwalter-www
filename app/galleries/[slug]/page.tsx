import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllGalleries, getGallery, getGalleryPhotos } from "@/lib/galleries";
import GalleryViewer from "@/components/GalleryViewer";
import type { Metadata } from "next";

interface GalleryPageProps {
  params: Promise<{ slug: string }>;
}

const SITE_URL = "https://micahwalter.com";

export async function generateStaticParams() {
  const galleries = getAllGalleries();
  if (galleries.length === 0) return [{ slug: "_placeholder" }];
  return galleries.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: GalleryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const gallery = getGallery(slug);
  if (!gallery) return { title: "Not Found" };

  return {
    title: `${gallery.title} — Galleries — Micah Walter`,
    description: gallery.description,
    openGraph: {
      title: gallery.title,
      description: gallery.description,
      type: "website",
      url: `${SITE_URL}/galleries/${slug}`,
    },
  };
}

export default async function GalleryPage({ params }: GalleryPageProps) {
  const { slug } = await params;

  if (slug === "_placeholder") notFound();

  const gallery = getGallery(slug);
  if (!gallery) notFound();

  const photos = getGalleryPhotos(gallery);

  return (
    <div className="min-h-screen">
      <header className="max-w-wide mx-auto px-6 py-12 border-b border-gray/20">
        <Link
          href="/galleries"
          className="text-sm text-gray no-underline hover:text-charcoal transition-colors mb-4 inline-block"
        >
          ← Galleries
        </Link>
        <h1 className="font-serif font-semibold text-4xl md:text-5xl mb-4 text-charcoal">
          {gallery.title}
        </h1>
        {gallery.description && (
          <p className="text-lg text-gray max-w-reading leading-relaxed">
            {gallery.description}
          </p>
        )}
        <p className="text-sm text-gray/60 mt-4">
          {photos.length} {photos.length === 1 ? "photo" : "photos"}
        </p>
      </header>

      {photos.length > 0 ? (
        <div className="max-w-wide mx-auto px-6 py-12">
          <GalleryViewer photos={photos} />
        </div>
      ) : (
        <div className="max-w-wide mx-auto px-6 py-24 text-center">
          <p className="text-gray text-lg">No photos in this gallery yet.</p>
        </div>
      )}
    </div>
  );
}
