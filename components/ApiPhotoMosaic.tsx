"use client";

import Link from "next/link";
import type { PublicPhoto } from "@/lib/photos-api";
import { photoCoverFilename, photoIdString } from "@/lib/photos-api";
import { CoverImage } from "./ResponsiveImage";

interface ApiPhotoMosaicProps {
  photos: PublicPhoto[];
}

export default function ApiPhotoMosaic({ photos }: ApiPhotoMosaicProps) {
  return (
    <div className="columns-2 md:columns-3 gap-4">
      {photos.map((photo) => (
        <Link
          key={photoIdString(photo)}
          href={`/photos/${photoIdString(photo)}`}
          className="group mb-4 block break-inside-avoid no-underline"
        >
          <div className="overflow-hidden rounded-lg">
            <CoverImage
              folderName={photo.folderName}
              filename={photoCoverFilename(photo)}
              alt={photo.title}
              className="w-full transition-transform duration-300 group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 50vw, 400px"
            />
          </div>
        </Link>
      ))}
    </div>
  );
}
