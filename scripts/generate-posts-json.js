const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const postsDirectory = path.join(process.cwd(), "content/posts");
const outputPath = path.join(process.cwd(), "public/posts.json");

function getAllPosts() {
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
      const fullPath = path.join(postsDirectory, folder, "index.mdx");

      if (!fs.existsSync(fullPath)) {
        return null;
      }

      const fileContents = fs.readFileSync(fullPath, "utf8");
      const { data } = matter(fileContents);

      const id = data.id ? String(data.id) : undefined;
      const slug = (data.type === 'photo' && id) ? id : folder.replace(/^\d{4}-\d{2}-\d{2}-/, "");

      // Resolve thumbnail URL from cover image (400px WebP variant)
      const coverFilename = data.coverImage
        ? data.coverImage.replace(/^\.\//, '').replace(/\.(jpg|jpeg|png)$/i, '')
        : null;
      const thumbnailUrl = coverFilename
        ? `/images/posts/${folder}/${coverFilename}-400.webp`
        : undefined;

      return {
        slug,
        folderName: folder, // Store folder name for image paths
        title: data.title || "",
        publishedAt: data.publishedAt || "",
        excerpt: data.excerpt || "",
        category: data.category || "Writing",
        tags: data.tags || [],
        coverImage: data.coverImage || undefined,
        thumbnailUrl,
        draft: data.draft || false,
        type: data.type || 'blog',
        // Photo-specific metadata for search
        camera: data.camera,
        lens: data.lens,
        location: data.location,
      };
    })
    .filter((post) => post !== null && !post.draft);

  return posts.sort((a, b) => {
    const dateA = new Date(a.publishedAt);
    const dateB = new Date(b.publishedAt);
    return dateB.getTime() - dateA.getTime();
  });
}

// Generate posts.json
const posts = getAllPosts();
fs.writeFileSync(outputPath, JSON.stringify(posts, null, 2));
console.log(`Generated ${outputPath} with ${posts.length} posts`);
