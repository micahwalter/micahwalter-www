const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const postsDirectory = path.join(process.cwd(), "content/posts");
const galleriesDirectory = path.join(process.cwd(), "content/galleries");
const sketchesDirectory = path.join(process.cwd(), "content/sketches");
const outputPath = path.join(process.cwd(), "public/sitemap.xml");
const mastodonJsonPath = path.join(process.cwd(), "public/mastodon.json");
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

function getAllGalleries() {
  if (!fs.existsSync(galleriesDirectory)) return [];

  return fs.readdirSync(galleriesDirectory)
    .filter((folder) => fs.statSync(path.join(galleriesDirectory, folder)).isDirectory())
    .map((folder) => {
      const fullPath = path.join(galleriesDirectory, folder, "index.mdx");
      if (!fs.existsSync(fullPath)) return null;
      const { data } = matter(fs.readFileSync(fullPath, "utf8"));
      return {
        slug: data.slug || folder,
        publishedAt: data.publishedAt || "",
        draft: data.draft || false,
      };
    })
    .filter((g) => g !== null && !g.draft);
}

function getAllSketches() {
  if (!fs.existsSync(sketchesDirectory)) return [];

  return fs.readdirSync(sketchesDirectory)
    .filter((folder) => fs.statSync(path.join(sketchesDirectory, folder)).isDirectory())
    .map((folder) => {
      const fullPath = path.join(sketchesDirectory, folder, "index.mdx");
      if (!fs.existsSync(fullPath)) return null;
      const { data } = matter(fs.readFileSync(fullPath, "utf8"));
      return {
        slug: folder,
        publishedAt: data.publishedAt || "",
        draft: data.draft || false,
      };
    })
    .filter((s) => s !== null && !s.draft);
}

function getAllToots() {
  if (!fs.existsSync(mastodonJsonPath)) return [];
  const raw = fs.readFileSync(mastodonJsonPath, "utf8");
  return JSON.parse(raw);
}

function getAllCategories() {
  const posts = getAllPosts();
  const categories = new Set(posts.map((post) => post.category));
  return Array.from(categories);
}

function generateSitemap() {
  const posts = getAllPosts();
  const categories = getAllCategories();
  const galleries = getAllGalleries();
  const sketches = getAllSketches();
  const toots = getAllToots();

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

  const today = new Date().toISOString().split("T")[0];

  const tootUrls = toots.map((toot) => {
    const lastmod = new Date(toot.createdAt).toISOString().split("T")[0];
    return `
  <url>
    <loc>${baseUrl}/micro/${toot.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>never</changefreq>
    <priority>0.4</priority>
  </url>`;
  }).join("");

  const galleryIndexUrl = `
  <url>
    <loc>${baseUrl}/galleries</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;

  const galleryUrls = galleries.map((gallery) => {
    const lastmod = new Date(gallery.publishedAt).toISOString().split("T")[0];
    return `
  <url>
    <loc>${baseUrl}/galleries/${gallery.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
  }).join("");

  const sketchUrls = sketches.map((sketch) => {
    const lastmod = new Date(sketch.publishedAt).toISOString().split("T")[0];
    return `
  <url>
    <loc>${baseUrl}/sketches/${sketch.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
  }).join("");

  const microIndexUrl = toots.length > 0 ? `
  <url>
    <loc>${baseUrl}/micro</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>` : "";

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/sketches</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>${galleryIndexUrl}${galleryUrls}${sketchUrls}${microIndexUrl}${postUrls}${categoryUrls}${tootUrls}
</urlset>`;

  fs.writeFileSync(outputPath, sitemap);
  console.log(`Generated ${outputPath} with ${posts.length} posts, ${categories.length} categories, ${galleries.length} galleries, ${sketches.length} sketches, and ${toots.length} toots`);
}

generateSitemap();
