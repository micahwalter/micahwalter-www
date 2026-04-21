"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Toot } from "@/lib/mastodon";

function formatTootDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTootTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

const PER_PAGE = 20;

interface PaginatedTootListProps {
  toots: Toot[];
}

function PaginatedTootListInner({ toots }: PaginatedTootListProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const totalPages = Math.ceil(toots.length / PER_PAGE);
  const pageParam = Number(searchParams.get("page")) || 1;
  const page = Math.min(Math.max(1, pageParam), totalPages);
  const paginated = toots.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (p === 1) {
      params.delete("page");
    } else {
      params.set("page", String(p));
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: true });
  }

  return (
    <div>
      <ul className="space-y-8">
        {paginated.map((toot) => (
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

      {totalPages > 1 && (
        <nav className="mt-12 flex items-center justify-center gap-4">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 text-sm font-medium text-charcoal border border-gray/30 rounded-lg hover:bg-charcoal/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <span className="text-sm text-gray">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => goToPage(page + 1)}
            disabled={page === totalPages}
            className="px-4 py-2 text-sm font-medium text-charcoal border border-gray/30 rounded-lg hover:bg-charcoal/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </nav>
      )}
    </div>
  );
}

export default function PaginatedTootList(props: PaginatedTootListProps) {
  return (
    <Suspense>
      <PaginatedTootListInner {...props} />
    </Suspense>
  );
}
