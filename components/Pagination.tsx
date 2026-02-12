import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  basePath = "/page",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const showEllipsis = totalPages > 7;

  // Determine which pages to show
  let pagesToShow: (number | string)[] = pages;
  if (showEllipsis) {
    if (currentPage <= 3) {
      pagesToShow = [1, 2, 3, 4, "...", totalPages];
    } else if (currentPage >= totalPages - 2) {
      pagesToShow = [
        1,
        "...",
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    } else {
      pagesToShow = [
        1,
        "...",
        currentPage - 1,
        currentPage,
        currentPage + 1,
        "...",
        totalPages,
      ];
    }
  }

  const getPageHref = (page: number) => {
    if (page === 1) return "/";
    return `${basePath}/${page}`;
  };

  return (
    <nav
      className="flex items-center justify-center gap-2 mt-12"
      aria-label="Pagination"
    >
      {/* Previous Button */}
      {currentPage > 1 ? (
        <Link
          href={getPageHref(currentPage - 1)}
          className="px-4 py-2 rounded-lg border border-gray/30 text-charcoal no-underline hover:bg-gray/5 transition-colors"
          aria-label="Previous page"
        >
          ← Previous
        </Link>
      ) : (
        <span className="px-4 py-2 rounded-lg border border-gray/10 text-gray/50 cursor-not-allowed">
          ← Previous
        </span>
      )}

      {/* Page Numbers */}
      <div className="hidden sm:flex items-center gap-2">
        {pagesToShow.map((page, index) =>
          typeof page === "number" ? (
            <Link
              key={index}
              href={getPageHref(page)}
              className={`px-4 py-2 rounded-lg no-underline transition-colors ${
                page === currentPage
                  ? "bg-charcoal text-cream font-semibold"
                  : "border border-gray/30 text-charcoal hover:bg-gray/5"
              }`}
              aria-label={`Page ${page}`}
              aria-current={page === currentPage ? "page" : undefined}
            >
              {page}
            </Link>
          ) : (
            <span
              key={index}
              className="px-2 text-gray"
              aria-hidden="true"
            >
              {page}
            </span>
          )
        )}
      </div>

      {/* Mobile page indicator */}
      <div className="sm:hidden px-4 py-2 text-gray">
        Page {currentPage} of {totalPages}
      </div>

      {/* Next Button */}
      {currentPage < totalPages ? (
        <Link
          href={getPageHref(currentPage + 1)}
          className="px-4 py-2 rounded-lg border border-gray/30 text-charcoal no-underline hover:bg-gray/5 transition-colors"
          aria-label="Next page"
        >
          Next →
        </Link>
      ) : (
        <span className="px-4 py-2 rounded-lg border border-gray/10 text-gray/50 cursor-not-allowed">
          Next →
        </span>
      )}
    </nav>
  );
}
