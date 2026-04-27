import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface Sketch {
  slug: string;
  title: string;
  publishedAt: string;
  excerpt: string;
  sketchType: "html" | "image" | "p5js";
  previewImage?: string;
  draft: boolean;
  content: string;
}

const sketchesDirectory = path.join(process.cwd(), "content/sketches");

export function getAllSketches(): Sketch[] {
  if (!fs.existsSync(sketchesDirectory)) {
    return [];
  }

  const folders = fs.readdirSync(sketchesDirectory);

  const sketches = folders
    .filter((folder) =>
      fs.statSync(path.join(sketchesDirectory, folder)).isDirectory()
    )
    .map((folder) => {
      const fullPath = path.join(sketchesDirectory, folder, "index.mdx");
      if (!fs.existsSync(fullPath)) return null;

      const fileContents = fs.readFileSync(fullPath, "utf8");
      const { data, content } = matter(fileContents);

      return {
        slug: folder,
        title: data.title || "",
        publishedAt: data.publishedAt || "",
        excerpt: data.excerpt || "",
        sketchType: data.sketchType || "html",
        previewImage: data.previewImage,
        draft: data.draft || false,
        content,
      } as Sketch;
    })
    .filter((sketch): sketch is Sketch => {
      if (sketch === null) return false;
      if (process.env.NODE_ENV === "development") return true;
      return !sketch.draft;
    });

  return sketches;
}

export function getSortedSketches(): Sketch[] {
  return getAllSketches().sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getSketchBySlug(slug: string): Sketch | null {
  return getAllSketches().find((s) => s.slug === slug) ?? null;
}
