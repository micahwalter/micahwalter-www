import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getAllToots, formatTootDate, formatTootTime } from "@/lib/mastodon";

export const metadata: Metadata = {
  title: "Micro",
  description:
    "Short posts and thoughts from my Mastodon account @micah@micah.social, archived here on my own site.",
};

export default function MicroPage() {
  const toots = getAllToots();

  return (
    <div className="max-w-reading mx-auto px-6 py-12">
      <h1 className="font-serif font-semibold text-4xl md:text-5xl text-charcoal mb-4">
        Micro
      </h1>
      <p className="text-gray text-lg leading-relaxed mb-2">
        Short posts and thoughts, fetched from my Mastodon account at{" "}
        <a
          href="https://micah.social/@micah"
          target="_blank"
          rel="noopener noreferrer"
          className="text-charcoal underline decoration-accent underline-offset-2 hover:text-accent transition-colors"
        >
          @micah@micah.social
        </a>
        .
      </p>
      <p className="text-gray text-base leading-relaxed mb-10">
        This archive is generated at build time — new posts appear here after
        each site deploy. To follow in real time, find me on Mastodon.
      </p>

      {toots.length === 0 ? (
        <p className="text-gray">No posts yet.</p>
      ) : (
        <ul className="space-y-8">
          {toots.map((toot) => (
            <li key={toot.id} className="border-b border-charcoal/10 pb-8 last:border-0">
              <Link href={`/micro/${toot.id}`} className="no-underline group block">
                <p className="text-sm text-gray mb-2">
                  {formatTootDate(toot.createdAt)} &middot;{" "}
                  {formatTootTime(toot.createdAt)}
                </p>

                {toot.spoilerText && (
                  <p className="text-sm font-semibold text-charcoal mb-2 italic">
                    CW: {toot.spoilerText}
                  </p>
                )}

                <div
                  className="toot-content text-charcoal leading-relaxed group-hover:text-charcoal/80 transition-colors"
                  dangerouslySetInnerHTML={{ __html: toot.content }}
                />

                {toot.mediaAttachments.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {toot.mediaAttachments.slice(0, 4).map((m) =>
                      m.type === "image" ? (
                        <div key={m.id} className="relative aspect-video overflow-hidden rounded bg-charcoal/5">
                          <Image
                            src={m.previewUrl || m.url}
                            alt={m.description || ""}
                            fill
                            className="object-cover"
                            sizes="(max-width: 645px) 50vw, 320px"
                          />
                        </div>
                      ) : m.type === "video" || m.type === "gifv" ? (
                        <div key={m.id} className="relative aspect-video overflow-hidden rounded bg-charcoal/5 flex items-center justify-center">
                          <span className="text-xs text-gray">Video</span>
                        </div>
                      ) : null
                    )}
                  </div>
                )}

                {toot.tags.length > 0 && (
                  <p className="mt-3 text-xs text-gray">
                    {toot.tags.map((t) => `#${t}`).join(" ")}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
