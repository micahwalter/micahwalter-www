#!/usr/bin/env node
/**
 * Remove photo (and optionally gallery) markdown from the content tree after
 * DynamoDB migration is verified.
 *
 * Usage:
 *   node scripts/cleanup-photo-content.js           # dry-run
 *   node scripts/cleanup-photo-content.js --apply   # delete folders
 *   node scripts/cleanup-photo-content.js --apply --galleries
 *
 * Never touches blog/email posts (type !== photo).
 */

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const APPLY = process.argv.includes("--apply");
const DO_GALLERIES = process.argv.includes("--galleries");
const POSTS = path.join(__dirname, "..", "content", "posts");
const GALLERIES = path.join(__dirname, "..", "content", "galleries");

function rmrf(target) {
  fs.rmSync(target, { recursive: true, force: true });
}

function listPhotoFolders() {
  if (!fs.existsSync(POSTS)) return [];
  const out = [];
  for (const folder of fs.readdirSync(POSTS)) {
    const dir = path.join(POSTS, folder);
    if (!fs.statSync(dir).isDirectory()) continue;
    const indexPath = path.join(dir, "index.md");
    if (!fs.existsSync(indexPath)) continue;
    const { data } = matter(fs.readFileSync(indexPath, "utf8"));
    if (data.type === "photo") {
      out.push({ folder, dir, id: data.id });
    }
  }
  return out;
}

function listGalleryFolders() {
  if (!fs.existsSync(GALLERIES)) return [];
  return fs
    .readdirSync(GALLERIES)
    .filter((f) => fs.statSync(path.join(GALLERIES, f)).isDirectory())
    .map((folder) => ({
      folder,
      dir: path.join(GALLERIES, folder),
    }));
}

function main() {
  const photos = listPhotoFolders();
  console.log(`Photo folders: ${photos.length}`);
  for (const p of photos) {
    console.log(`- posts/${p.folder} (id=${p.id})`);
  }

  let galleries = [];
  if (DO_GALLERIES) {
    galleries = listGalleryFolders();
    console.log(`\nGallery folders: ${galleries.length}`);
    for (const g of galleries) {
      console.log(`- galleries/${g.folder}`);
    }
  } else {
    console.log("\nGalleries skipped (pass --galleries to include).");
  }

  console.log(`\nMode: ${APPLY ? "APPLY" : "DRY-RUN"}`);

  if (!APPLY) {
    console.log("Dry-run only. Re-run with --apply after API verify.");
    return;
  }

  for (const p of photos) {
    rmrf(p.dir);
    console.log(`removed ${p.dir}`);
  }
  for (const g of galleries) {
    rmrf(g.dir);
    console.log(`removed ${g.dir}`);
  }
  console.log("\nDone. Commit the content tree change when ready.");
}

main();
