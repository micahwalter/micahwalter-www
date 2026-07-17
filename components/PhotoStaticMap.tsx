"use client";

import { useState } from "react";
import { buildStaticMapUrl } from "@/lib/photos-api";

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
  if (failed) return null;

  const src = buildStaticMapUrl(latitude, longitude);
  const osmLink = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=12/${latitude}/${longitude}`;

  return (
    <div className="mt-8">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray mb-3">
        Location{label ? ` · ${label}` : ""}
      </h3>
      <a href={osmLink} target="_blank" rel="noopener noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={label ? `Map of ${label}` : "Map of photo location"}
          className="w-full rounded-lg border border-gray/10"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      </a>
    </div>
  );
}
