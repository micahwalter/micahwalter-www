import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { getAllGalleries, getGallery, getGalleryPhotos } from "@/lib/galleries";
import { CoverImage } from "@/components/ResponsiveImage";
import type { Post } from "@/lib/content";
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

function GalleryPhotoCard({ post }: { post: Post }) {
  const coverFilename = post.coverImage
    ? post.coverImage.replace(/^\.\//, "").replace(/\.(jpg|jpeg|png)$/i, "")
    : "photo";

  const exifParts = [
    post.camera,
    post.aperture,
    post.shutterSpeed,
    post.iso ? `ISO ${post.iso}` : null,
  ].filter(Boolean);

  return (
    <article className="group">
      {/* Image */}
      <div className="relative overflow-hidden rounded-lg mb-3">
        {post.coverImage ? (
          <CoverImage
            folderName={post.folderName}
            filename={coverFilename}
            alt={post.title}
            className="w-full h-auto transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 400px, 500px"
          />
        ) : (
          <div className="aspect-square w-full rounded-lg bg-gradient-to-br from-accent/20 to-gray/10 flex items-center justify-center">
            <span className="text-5xl">📷</span>
          </div>
        )}

        {/* EXIF overlay on hover */}
        {exifParts.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-charcoal/90 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-lg">
            <p className="text-xs text-cream/80 font-mono">
              {exifParts.slice(0, 3).join(" · ")}
            </p>
          </div>
        )}
      </div>

      {/* Metadata row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-serif font-medium text-charcoal truncate group-hover:text-gray transition-colors">
            {post.title}
          </p>
          {post.location && (
            <p className="text-xs text-gray mt-0.5 truncate">{post.location}</p>
          )}
          {post.dateTaken && (
            <p className="text-xs text-gray/60 mt-0.5">
              {format(new Date(post.dateTaken), "MMMM d, yyyy")}
            </p>
          )}
        </div>

        <Link
          href={`/posts/${post.slug}`}
          className="flex-shrink-0 text-xs text-gray border border-gray/30 rounded px-2 py-1 no-underline hover:border-gray hover:bg-gray/10 transition-colors whitespace-nowrap"
          title="View photo page"
        >
          View →
        </Link>
      </div>
    </article>
  );
}

export default async function GalleryPage({ params }: GalleryPageProps) {
  const { slug } = await params;

  if (slug === "_placeholder") notFound();

  const gallery = getGallery(slug);
  if (!gallery) notFound();

  const photos = getGalleryPhotos(gallery);

  return (
    <div className="min-h-screen">
      {/* Header */}
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

      {/* Grid */}
      {photos.length > 0 ? (
        <div className="max-w-wide mx-auto px-6 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {photos.map((photo) => (
              <GalleryPhotoCard key={photo.slug} post={photo} />
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-wide mx-auto px-6 py-24 text-center">
          <p className="text-gray text-lg">No photos in this gallery yet.</p>
        </div>
      )}
    </div>
  );
}
