import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface Post {
  slug: string;
  id?: string; // Unique sequential integer ID for photo posts (used as URL slug)
  folderName: string; // Folder name with date prefix for image paths
  title: string;
  publishedAt: string;
  excerpt: string;
  category: string;
  tags: string[];
  coverImage?: string;
  draft: boolean;
  content: string;
  type?: 'blog' | 'photo'; // Content type (defaults to 'blog')

  // Photo-specific metadata (optional, extracted from EXIF)
  camera?: string; // e.g., "Canon EOS R5"
  lens?: string; // e.g., "RF 24-105mm f/4L IS USM"
  aperture?: string; // e.g., "f/2.8"
  shutterSpeed?: string; // e.g., "1/500"
  iso?: string; // e.g., "400"
  focalLength?: string; // e.g., "50mm"
  dateTaken?: string; // e.g., "2025-02-15T14:30:00"
  location?: string; // e.g., "Brooklyn, NY"
}

const postsDirectory = path.join(process.cwd(), "content/posts");

export function getAllPosts(): Post[] {
  // Check if posts directory exists
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const postFolders = fs.readdirSync(postsDirectory);

  const posts = postFolders
    .filter((folder) => {
      const fullPath = path.join(postsDirectory, folder);
      return fs.statSync(fullPath).isDirectory();
    })
    .map((folder) => {
      const folderSlug = folder.replace(/^\d{4}-\d{2}-\d{2}-/, "");
      const fullPath = path.join(postsDirectory, folder, "index.mdx");

      if (!fs.existsSync(fullPath)) {
        return null;
      }

      const fileContents = fs.readFileSync(fullPath, "utf8");
      const { data, content } = matter(fileContents);

      const id = data.id ? String(data.id) : undefined;
      const slug = (data.type === 'photo' && id) ? id : folderSlug;

      return {
        slug,
        id,
        folderName: folder, // Store folder name for image paths
        title: data.title || "",
        publishedAt: data.publishedAt || "",
        excerpt: data.excerpt || "",
        category: data.category || "Writing",
        tags: data.tags || [],
        coverImage: data.coverImage || undefined,
        draft: data.draft || false,
        content,
        type: data.type || 'blog',
        // Photo-specific metadata
        camera: data.camera,
        lens: data.lens,
        aperture: data.aperture,
        shutterSpeed: data.shutterSpeed,
        iso: data.iso,
        focalLength: data.focalLength,
        dateTaken: data.dateTaken,
        location: data.location,
      } as Post;
    })
    .filter((post): post is Post => {
      if (post === null) return false;
      // Show drafts in development mode, hide in production
      if (process.env.NODE_ENV === 'development') return true;
      return !post.draft;
    });

  return posts;
}

export function getSortedPosts(): Post[] {
  const posts = getAllPosts();
  return posts.sort((a, b) => {
    const dateA = new Date(a.publishedAt);
    const dateB = new Date(b.publishedAt);
    return dateB.getTime() - dateA.getTime();
  });
}

export function getPostBySlug(slug: string): Post | null {
  const posts = getAllPosts();
  return posts.find((post) => post.slug === slug) || null;
}

export function getPostsByCategory(category: string): Post[] {
  const posts = getSortedPosts();
  return posts.filter(
    (post) => post.category.toLowerCase() === category.toLowerCase()
  );
}

export function getPaginatedPosts(
  page: number = 1,
  perPage: number = 10
): {
  posts: Post[];
  totalPages: number;
  currentPage: number;
} {
  const posts = getSortedPosts();
  const totalPages = Math.ceil(posts.length / perPage);
  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + perPage;
  const paginatedPosts = posts.slice(startIndex, endIndex);

  return {
    posts: paginatedPosts,
    totalPages,
    currentPage: page,
  };
}

export function getAllCategories(): string[] {
  const posts = getAllPosts();
  const categories = new Set(posts.map((post) => post.category));
  return Array.from(categories);
}

export function getAllTags(): string[] {
  const posts = getAllPosts();
  const tags = new Set(posts.flatMap((post) => post.tags));
  return Array.from(tags);
}

export function getPostsByTag(tag: string): Post[] {
  const posts = getSortedPosts();
  return posts.filter((post) =>
    post.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
  );
}

export function getPhotos(): Post[] {
  return getSortedPosts().filter(post => post.type === 'photo');
}

export function getBlogPosts(): Post[] {
  return getSortedPosts().filter(post => !post.type || post.type === 'blog');
}

export function getPostsByYear(year: string): Post[] {
  return getSortedPosts().filter(post => post.publishedAt.startsWith(year + '-'));
}

export function getPostsByYearMonth(year: string, month: string): Post[] {
  return getSortedPosts().filter(post =>
    post.publishedAt.startsWith(`${year}-${month.padStart(2, '0')}-`)
  );
}

export function getAllYears(): string[] {
  const posts = getAllPosts();
  const years = new Set(posts.map(post => post.publishedAt.slice(0, 4)));
  return Array.from(years).sort((a, b) => b.localeCompare(a));
}

export function getAllYearMonths(): { year: string; month: string }[] {
  const posts = getAllPosts();
  const seen = new Set<string>();
  const result: { year: string; month: string }[] = [];
  for (const post of posts) {
    const year = post.publishedAt.slice(0, 4);
    const month = post.publishedAt.slice(5, 7);
    const key = `${year}-${month}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ year, month });
    }
  }
  return result.sort((a, b) => {
    const da = `${a.year}-${a.month}`;
    const db = `${b.year}-${b.month}`;
    return db.localeCompare(da);
  });
}
