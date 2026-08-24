import type { Metadata } from "next";

export const SITE_URL = "https://www.micahwalter.com";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/share-card.jpg`;

export function absoluteUrl(path: string): string {
  if (!path) return SITE_URL;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function postCoverOgImage(post: {
  coverImage?: string;
  folderName: string;
}): string | undefined {
  if (!post.coverImage) return undefined;
  const coverFilename = post.coverImage
    .replace(/^\.\//, "")
    .replace(/\.(jpg|jpeg|png)$/i, "");
  return `${SITE_URL}/images/posts/${post.folderName}/${coverFilename}-1200.jpg`;
}

type SocialInput = {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  type?: "website" | "article";
  publishedTime?: string;
  tags?: string[];
};

export function withSocial({
  title,
  description,
  path,
  image,
  type = "website",
  publishedTime,
  tags,
}: SocialInput): Metadata {
  const url = absoluteUrl(path);
  const img = image || DEFAULT_OG_IMAGE;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "Micah Walter",
      locale: "en_US",
      type,
      images: [{ url: img, width: 1200, alt: title }],
      ...(publishedTime ? { publishedTime } : {}),
      ...(tags && tags.length ? { tags } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [img],
    },
  };
}
