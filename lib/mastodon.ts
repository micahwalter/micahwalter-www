import fs from "fs";
import path from "path";

export interface MediaAttachment {
  id: string;
  type: "image" | "video" | "gifv" | "audio" | "unknown";
  url: string;
  previewUrl: string;
  description: string;
  meta: Record<string, unknown>;
}

export interface Toot {
  id: string;
  url: string;
  createdAt: string;
  content: string;
  plainText: string;
  summary: string;
  sensitive: boolean;
  spoilerText: string;
  visibility: string;
  mediaAttachments: MediaAttachment[];
  tags: string[];
  favouritesCount: number;
  reblogsCount: number;
  repliesCount: number;
}

let _cache: Toot[] | null = null;

export function getAllToots(): Toot[] {
  if (_cache) return _cache;
  const filePath = path.join(process.cwd(), "public", "mastodon.json");
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf-8");
  _cache = JSON.parse(raw) as Toot[];
  return _cache;
}

export function getTootById(id: string): Toot | undefined {
  return getAllToots().find((t) => t.id === id);
}

export function formatTootDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatTootTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
