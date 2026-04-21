import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getPhotos } from "./content";
import type { Post } from "./content";

export interface Gallery {
  slug: string;
  title: string;
  description: string;
  coverPhoto?: number;
  publishedAt: string;
  photoIds: number[];
  draft: boolean;
  content: string;
}

const galleriesDirectory = path.join(process.cwd(), "content/galleries");

export function getAllGalleries(): Gallery[] {
  if (!fs.existsSync(galleriesDirectory)) {
    return [];
  }

  const folders = fs.readdirSync(galleriesDirectory).filter((f) => {
    const fullPath = path.join(galleriesDirectory, f);
    return fs.statSync(fullPath).isDirectory();
  });

  const galleries = folders
    .map((folder) => {
      const fullPath = path.join(galleriesDirectory, folder, "index.mdx");
      if (!fs.existsSync(fullPath)) return null;

      const fileContents = fs.readFileSync(fullPath, "utf8");
      const { data, content } = matter(fileContents);

      return {
        slug: data.slug || folder,
        title: data.title || "",
        description: data.description || "",
        coverPhoto: data.coverPhoto ? Number(data.coverPhoto) : undefined,
        publishedAt: data.publishedAt || "",
        photoIds: (data.photos || []).map(Number),
        draft: data.draft || false,
        content,
      } as Gallery;
    })
    .filter((g): g is Gallery => {
      if (g === null) return false;
      if (process.env.NODE_ENV === "development") return true;
      return !g.draft;
    });

  return galleries.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getGallery(slug: string): Gallery | null {
  return getAllGalleries().find((g) => g.slug === slug) || null;
}

export function getGalleryPhotos(gallery: Gallery): Post[] {
  const allPhotos = getPhotos();
  const photoMap = new Map(allPhotos.map((p) => [Number(p.id), p]));
  return gallery.photoIds
    .map((id) => photoMap.get(id))
    .filter((p): p is Post => p !== undefined);
}
