const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const postsDirectory = path.join(process.cwd(), "content/posts");
const outputPath = path.join(process.cwd(), "public/sitemap.xml");
const baseUrl = "https://micahwalter.com";

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
      const slug = folder.replace(/^\d{4}-\d{2}-\d{2}-/, "");
      const fullPath = path.join(postsDirectory, folder, "index.mdx");

      if (!fs.existsSync(fullPath)) {
        return null;
      }

      const fileContents = fs.readFileSync(fullPath, "utf8");
      const { data } = matter(fileContents);

      return {
        slug,
        publishedAt: data.publishedAt || "",
        category: data.category || "Writing",
        draft: data.draft || false,
      };
    })
    .filter((post) => post !== null && !post.draft);

  return posts;
}

function getAllCategories() {
  const posts = getAllPosts();
  const categories = new Set(posts.map((post) => post.category));
  return Array.from(categories);
}

function generateSitemap() {
  const posts = getAllPosts();
  const categories = getAllCategories();

  const postUrls = posts.map((post) => {
    const lastmod = new Date(post.publishedAt).toISOString().split("T")[0];
    return `
  <url>
    <loc>${baseUrl}/posts/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
  }).join("");

  const categoryUrls = categories.map((category) => {
    return `
  <url>
    <loc>${baseUrl}/topics/${category.toLowerCase()}</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
  }).join("");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/sketches</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>${postUrls}${categoryUrls}
</urlset>`;

  fs.writeFileSync(outputPath, sitemap);
  console.log(`Generated ${outputPath} with ${posts.length} posts and ${categories.length} categories`);
}

generateSitemap();
