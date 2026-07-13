import Link from "next/link";
import type { Post } from "@/lib/content";
import { CoverImage } from "./ResponsiveImage";

interface PhotoMosaicProps {
  photos: Post[];
}

function coverFilename(coverImage: string) {
  return coverImage.replace(/^\.\//, "").replace(/\.(jpg|jpeg|png)$/i, "");
}

/**
 * Column-based mosaic for mixed portrait and landscape photos.
 * Each image keeps its natural aspect ratio; columns pack tightly
 * without the ragged row gaps of a uniform grid.
 */
export default function PhotoMosaic({ photos }: PhotoMosaicProps) {
  return (
    <div className="columns-2 md:columns-3 gap-4">
      {photos.map((photo) => (
        <Link
          key={photo.slug}
          href={`/posts/${photo.slug}`}
          className="group mb-4 block break-inside-avoid no-underline"
        >
          <div className="overflow-hidden rounded-lg">
            <CoverImage
              folderName={photo.folderName}
              filename={coverFilename(photo.coverImage!)}
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
