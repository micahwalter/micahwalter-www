import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface Post {
  slug: string;
  title: string;
  publishedAt: string;
  excerpt: string;
  category: string;
  tags: string[];
  coverImage?: string;
  draft: boolean;
  content: string;
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
      const slug = folder.replace(/^\d{4}-\d{2}-\d{2}-/, "");
      const fullPath = path.join(postsDirectory, folder, "index.mdx");

      if (!fs.existsSync(fullPath)) {
        return null;
      }

      const fileContents = fs.readFileSync(fullPath, "utf8");
      const { data, content } = matter(fileContents);

      // Convert relative cover image paths to public URLs
      let coverImage = data.coverImage;
      if (coverImage && coverImage.startsWith("./")) {
        const imageName = coverImage.replace("./", "");
        coverImage = `/images/posts/${folder}-${imageName}`;
      }

      return {
        slug,
        title: data.title || "",
        publishedAt: data.publishedAt || "",
        excerpt: data.excerpt || "",
        category: data.category || "Writing",
        tags: data.tags || [],
        coverImage: coverImage || undefined,
        draft: data.draft || false,
        content,
      } as Post;
    })
    .filter((post): post is Post => post !== null && !post.draft);

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
