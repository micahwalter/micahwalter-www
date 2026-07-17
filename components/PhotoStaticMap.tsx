"use client";

import { useState } from "react";
import { buildOsmEmbedUrl, buildOsmBrowseUrl } from "@/lib/photos-api";

interface PhotoStaticMapProps {
  latitude: number;
  longitude: number;
  label?: string | null;
}

export default function PhotoStaticMap({
  latitude,
  longitude,
  label,
}: PhotoStaticMapProps) {
  const [failed, setFailed] = useState(false);
  const embedSrc = buildOsmEmbedUrl(latitude, longitude);
  const osmLink = buildOsmBrowseUrl(latitude, longitude);

  return (
    <div className="mt-8">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray mb-3">
        Location{label ? ` · ${label}` : ""}
      </h3>
      {!failed ? (
        <iframe
          title={label ? `Map of ${label}` : "Map of photo location"}
          src={embedSrc}
          className="w-full h-[280px] rounded-lg border border-gray/10 bg-cream"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          onError={() => setFailed(true)}
        />
      ) : null}
      <p className={`text-xs text-gray ${failed ? "" : "mt-2"}`}>
        <a
          href={osmLink}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-charcoal"
        >
          {failed ? "View on OpenStreetMap" : "Open in OpenStreetMap"}
        </a>
      </p>
    </div>
  );
}
