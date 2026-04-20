import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  getAllToots,
  getTootById,
  formatTootDate,
  formatTootTime,
} from "@/lib/mastodon";

interface TootPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const toots = getAllToots();
  if (toots.length === 0) return [{ id: "_placeholder" }];
  return toots.map((t) => ({ id: t.id }));
}

const SITE_URL = "https://www.micahwalter.com";

export async function generateMetadata({ params }: TootPageProps): Promise<Metadata> {
  const { id } = await params;
  const toot = getTootById(id);
  if (!toot) return { title: "Not Found" };

  const description = toot.summary || toot.plainText.slice(0, 160);
  const firstImage = toot.mediaAttachments.find((m) => m.type === "image");

  return {
    title: description.slice(0, 70) + (description.length > 70 ? "…" : ""),
    description,
    openGraph: {
      title: `@micah@micah.social — ${formatTootDate(toot.createdAt)}`,
      description,
      type: "article",
      url: `${SITE_URL}/micro/${id}`,
      publishedTime: toot.createdAt,
      ...(firstImage ? { images: [{ url: firstImage.url }] } : {}),
    },
    twitter: {
      card: firstImage ? "summary_large_image" : "summary",
      description,
    },
  };
}

export default async function TootPage({ params }: TootPageProps) {
  const { id } = await params;

  if (id === "_placeholder") notFound();

  const toot = getTootById(id);
  if (!toot) notFound();

  return (
    <div className="max-w-reading mx-auto px-6 py-12">
      <Link
        href="/micro"
        className="inline-flex items-center gap-1 text-sm text-gray no-underline hover:text-charcoal transition-colors mb-10"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-4 h-4"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        All posts
      </Link>

      <article>
        <p className="text-sm text-gray mb-4">
          {formatTootDate(toot.createdAt)} at {formatTootTime(toot.createdAt)}
        </p>

        {toot.spoilerText && (
          <div className="mb-4 px-4 py-3 bg-charcoal/5 rounded text-sm text-charcoal">
            <span className="font-semibold">Content warning:</span> {toot.spoilerText}
          </div>
        )}

        <div
          className="toot-content text-charcoal text-lg leading-relaxed mb-6"
          dangerouslySetInnerHTML={{ __html: toot.content }}
        />

        {toot.mediaAttachments.length > 0 && (
          <div className="mb-6 grid gap-3">
            {toot.mediaAttachments.map((m) =>
              m.type === "image" ? (
                <figure key={m.id}>
                  <div className="relative overflow-hidden rounded">
                    <Image
                      src={m.url}
                      alt={m.description || ""}
                      width={645}
                      height={430}
                      className="w-full h-auto object-cover"
                      sizes="(max-width: 645px) 100vw, 645px"
                    />
                  </div>
                  {m.description && (
                    <figcaption className="mt-2 text-sm text-gray italic">
                      {m.description}
                    </figcaption>
                  )}
                </figure>
              ) : m.type === "video" || m.type === "gifv" ? (
                <div key={m.id}>
                  <video
                    src={m.url}
                    controls
                    loop={m.type === "gifv"}
                    muted={m.type === "gifv"}
                    autoPlay={m.type === "gifv"}
                    className="w-full rounded"
                    aria-label={m.description || undefined}
                  />
                  {m.description && (
                    <p className="mt-2 text-sm text-gray italic">{m.description}</p>
                  )}
                </div>
              ) : null
            )}
          </div>
        )}

        {toot.tags.length > 0 && (
          <p className="text-sm text-gray mb-6">
            {toot.tags.map((t) => `#${t}`).join(" ")}
          </p>
        )}

        <div className="pt-6 border-t border-charcoal/10 flex items-center justify-between">
          <div className="flex gap-4 text-sm text-gray">
            <span title="Favourites">♥ {toot.favouritesCount}</span>
            <span title="Boosts">↑ {toot.reblogsCount}</span>
            <span title="Replies">↩ {toot.repliesCount}</span>
          </div>
          <a
            href={toot.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-charcoal underline decoration-accent underline-offset-2 hover:text-accent transition-colors no-underline"
          >
            View on Mastodon →
          </a>
        </div>
      </article>
    </div>
  );
}
