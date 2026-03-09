"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import PostCard from "./PostCard";
import PhotoCard from "./PhotoCard";
import type { Post } from "@/lib/content";

interface PaginatedPostGridProps {
  posts: Post[];
  perPage: number;
}

function PaginatedPostGridInner({ posts, perPage }: PaginatedPostGridProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const pageParam = Number(searchParams.get("page")) || 1;
  const totalPages = Math.ceil(posts.length / perPage);
  const page = Math.min(Math.max(1, pageParam), totalPages);
  const paginated = posts.slice((page - 1) * perPage, page * perPage);

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
    <div className="max-w-wide mx-auto px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {paginated.map((post) =>
          post.type === "photo" ? (
            <PhotoCard key={post.slug} post={post} />
          ) : (
            <PostCard key={post.slug} post={post} />
          )
        )}
      </div>

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

export default function PaginatedPostGrid(props: PaginatedPostGridProps) {
  return (
    <Suspense>
      <PaginatedPostGridInner {...props} />
    </Suspense>
  );
}
