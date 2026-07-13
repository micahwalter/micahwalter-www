import Link from "next/link";
import { getBlogPosts, getFeaturedPhoto, getPhotos } from "@/lib/content";
import { CoverImage } from "@/components/ResponsiveImage";

export default function Home() {
  const post = getFeaturedPhoto();

  const recentPosts = getBlogPosts().slice(0, 5);

  const recentPhotos = getPhotos()
    .filter((p) => p.slug !== post?.slug && p.coverImage)
    .slice(0, 6);

  if (!post || !post.coverImage) return null;

  const coverFilename = post.coverImage
    .replace(/^\.\//, "")
    .replace(/\.(jpg|jpeg|png)$/i, "");

  return (
    <main className="max-w-wide mx-auto px-6 py-12">
      <Link href={`/posts/${post.id}`} className="block no-underline">
        <CoverImage
          folderName={post.folderName}
          filename={coverFilename}
          alt={post.title}
          className="rounded-lg"
          priority={true}
          sizes="(max-width: 768px) 100vw, 1340px"
          viewportFit={true}
        />
      </Link>
      {recentPosts.length > 0 && (
        <section className="mt-16 max-w-reading mx-auto">
          <h2 className="font-serif font-semibold text-2xl text-charcoal mb-6">
            Recent Posts
          </h2>
          <ul className="space-y-4">
            {recentPosts.map((p) => (
              <li key={p.slug} className="border-b border-gray/20 pb-4">
                <Link
                  href={`/posts/${p.slug}`}
                  className="group no-underline"
                >
                  <span className="font-serif text-lg text-charcoal group-hover:text-accent transition-colors">
                    {p.title}
                  </span>
                  <span className="block text-sm text-gray mt-1">
                    {new Date(p.publishedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      timeZone: "UTC",
                    })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Link
              href="/posts"
              className="font-serif text-charcoal hover:text-accent transition-colors no-underline"
            >
              View all posts →
            </Link>
          </div>
        </section>
      )}
      {recentPhotos.length > 0 && (
        <section className="mt-16 max-w-wide mx-auto">
          <h2 className="font-serif font-semibold text-2xl text-charcoal mb-6">
            Recent Photos
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {recentPhotos.map((p) => {
              const filename = p.coverImage!
                .replace(/^\.\//, "")
                .replace(/\.(jpg|jpeg|png)$/i, "");
              return (
                <Link
                  key={p.slug}
                  href={`/posts/${p.slug}`}
                  className="group block no-underline"
                >
                  <CoverImage
                    folderName={p.folderName}
                    filename={filename}
                    alt={p.title}
                    className="rounded-lg transition-transform duration-300 group-hover:scale-[1.02]"
                    sizes="(max-width: 768px) 50vw, 400px"
                  />
                </Link>
              );
            })}
          </div>
          <div className="mt-8">
            <Link
              href="/photos"
              className="font-serif text-charcoal hover:text-accent transition-colors no-underline"
            >
              View all photos →
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
