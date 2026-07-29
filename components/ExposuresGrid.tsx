"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  listExposures,
  exposureCoverFilename,
  ExposuresApiError,
  type PublicExposure,
} from "@/lib/exposures-api";
import { CoverImage } from "./ResponsiveImage";

export default function ExposuresGrid() {
  const [items, setItems] = useState<PublicExposure[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (append = false, nextCursor?: string | null) => {
    if (!append) setLoading(true);
    setError("");
    try {
      const page = await listExposures({
        limit: 12,
        cursor: append ? nextCursor : null,
      });
      setItems((prev) => (append ? [...prev, ...page.items] : page.items));
      setCursor(page.cursor);
    } catch (err) {
      setError(
        err instanceof ExposuresApiError
          ? err.message
          : "Could not load Exposures.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  return (
    <div className="max-w-wide mx-auto px-6 py-12">
      {loading && items.length === 0 && (
        <p className="text-gray" style={{ fontFamily: "system-ui, sans-serif" }}>
          Loading…
        </p>
      )}
      {error && (
        <p className="text-red-700 mb-4" style={{ fontFamily: "system-ui, sans-serif" }}>
          {error}{" "}
          <button type="button" className="underline" onClick={() => load(false)}>
            Retry
          </button>
        </p>
      )}
      {!loading && !error && items.length === 0 && (
        <p className="text-gray" style={{ fontFamily: "system-ui, sans-serif" }}>
          No Exposures yet. The first Sunday send will appear here.
        </p>
      )}

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.map((exp) => (
          <li key={exp.issueNumber}>
            <Link href={`/exposures/${exp.issueNumber}`} className="group block">
              <div className="aspect-[4/3] overflow-hidden bg-gray/10 mb-3">
                {exp.folderName ? (
                  <CoverImage
                    folderName={exp.folderName}
                    filename={exposureCoverFilename(exp)}
                    alt={exp.title}
                    className="w-full h-full object-cover transition-opacity group-hover:opacity-90"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : null}
              </div>
              <p className="text-xs text-gray tracking-wide uppercase mb-1">
                Exposure #{exp.issueNumber}
                {exp.sentAt
                  ? ` · ${format(new Date(exp.sentAt), "MMM d, yyyy")}`
                  : ""}
              </p>
              <h2 className="font-serif text-xl text-charcoal group-hover:text-accent transition-colors">
                {exp.title}
              </h2>
            </Link>
          </li>
        ))}
      </ul>

      {cursor && (
        <button
          type="button"
          onClick={() => load(true, cursor)}
          className="mt-10 text-sm text-charcoal underline hover:text-accent"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          Load more
        </button>
      )}
    </div>
  );
}
