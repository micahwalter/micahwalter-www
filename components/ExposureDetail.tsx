"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  getExposure,
  exposureCoverFilename,
  ExposuresApiError,
  type PublicExposure,
} from "@/lib/exposures-api";
import { CoverImage } from "./ResponsiveImage";

type Status = "loading" | "ready" | "notfound" | "error";

function resolveN(hint: string): string {
  if (typeof window !== "undefined") {
    const m = window.location.pathname.match(/^\/exposures\/(\d+)/);
    if (m?.[1]) return m[1];
  }
  return hint;
}

export default function ExposureDetail({ nHint }: { nHint: string }) {
  const [status, setStatus] = useState<Status>("loading");
  const [exposure, setExposure] = useState<PublicExposure | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const n = resolveN(nHint);
    setStatus("loading");
    setError("");
    try {
      const item = await getExposure(n);
      setExposure(item);
      setStatus("ready");
    } catch (err) {
      if (err instanceof ExposuresApiError && err.status === 404) {
        setStatus("notfound");
      } else {
        setError(err instanceof ExposuresApiError ? err.message : "Could not load.");
        setStatus("error");
      }
    }
  }, [nHint]);

  useEffect(() => {
    load();
  }, [load]);

  if (status === "loading") {
    return (
      <div className="max-w-reading mx-auto px-6 py-16">
        <p className="text-gray">Loading…</p>
      </div>
    );
  }

  if (status === "notfound") {
    return (
      <div className="max-w-reading mx-auto px-6 py-16">
        <p className="text-gray mb-4">Exposure not found.</p>
        <Link href="/exposures" className="underline text-charcoal">
          All Exposures
        </Link>
      </div>
    );
  }

  if (status === "error" || !exposure) {
    return (
      <div className="max-w-reading mx-auto px-6 py-16">
        <p className="text-red-700 mb-4">{error || "Error"}</p>
        <button type="button" className="underline" onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <article className="max-w-reading mx-auto px-6 py-12">
      <p className="text-xs text-gray tracking-wide uppercase mb-4">
        Exposure #{exposure.issueNumber}
        {exposure.sentAt
          ? ` · ${format(new Date(exposure.sentAt), "MMMM d, yyyy")}`
          : ""}
      </p>

      {exposure.folderName ? (
        <Link href={`/photos/${exposure.photoId}`} className="block mb-8">
          <CoverImage
            folderName={exposure.folderName}
            filename={exposureCoverFilename(exposure)}
            alt={exposure.title}
            className="w-full h-auto"
            sizes="(max-width: 768px) 100vw, 645px"
            priority
          />
        </Link>
      ) : null}

      <h1 className="font-serif text-4xl text-charcoal mb-4">
        <Link href={`/photos/${exposure.photoId}`} className="hover:text-accent transition-colors">
          {exposure.title}
        </Link>
      </h1>

      {exposure.caption ? (
        <p className="text-lg text-gray mb-8 leading-relaxed">{exposure.caption}</p>
      ) : null}

      <p className="text-sm">
        <Link href={`/photos/${exposure.photoId}`} className="underline text-charcoal hover:text-accent">
          View photo
        </Link>
        {" · "}
        <Link href="/exposures" className="underline text-charcoal hover:text-accent">
          All Exposures
        </Link>
      </p>
    </article>
  );
}
