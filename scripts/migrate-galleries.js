#!/usr/bin/env node
/**
 * Migrate content/galleries/*/index.md → DynamoDB micahwalter-galleries.
 *
 * Usage:
 *   node scripts/migrate-galleries.js              # dry-run
 *   node scripts/migrate-galleries.js --apply      # write
 *
 * Env:
 *   GALLERIES_TABLE (default micahwalter-galleries)
 *   AWS_PROFILE / AWS_REGION (default us-east-1)
 */

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

const APPLY = process.argv.includes("--apply");
const TABLE = process.env.GALLERIES_TABLE || "micahwalter-galleries";
const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const ROOT = path.join(__dirname, "..", "content", "galleries");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }), {
  marshallOptions: { removeUndefinedValues: true },
});

function nowIso() {
  return new Date().toISOString();
}

function loadGalleries() {
  if (!fs.existsSync(ROOT)) return [];
  return fs
    .readdirSync(ROOT)
    .filter((f) => fs.statSync(path.join(ROOT, f)).isDirectory())
    .map((folder) => {
      const fullPath = path.join(ROOT, folder, "index.md");
      if (!fs.existsSync(fullPath)) return null;
      const { data, content } = matter(fs.readFileSync(fullPath, "utf8"));
      const slug = String(data.slug || folder);
      const now = nowIso();
      return {
        slug,
        title: String(data.title || slug),
        description: String(data.description || ""),
        coverPhotoId:
          data.coverPhoto != null && data.coverPhoto !== ""
            ? String(data.coverPhoto)
            : null,
        publishedAt: String(data.publishedAt || now.slice(0, 10)),
        photoIds: (data.photos || []).map(String),
        draft: !!data.draft,
        content: String(content || "").trim(),
        createdAt: now,
        updatedAt: now,
        _source: fullPath,
      };
    })
    .filter(Boolean);
}

async function main() {
  const galleries = loadGalleries();
  console.log(`Found ${galleries.length} gallery folder(s) under content/galleries`);
  console.log(`Table: ${TABLE}  Region: ${REGION}  Mode: ${APPLY ? "APPLY" : "DRY-RUN"}`);

  for (const g of galleries) {
    const { _source, ...item } = g;
    console.log(`- ${item.slug}: ${item.title} (${item.photoIds.length} photos)${item.draft ? " [draft]" : ""}`);
    console.log(`  source: ${_source}`);
    if (APPLY) {
      await ddb.send(
        new PutCommand({
          TableName: TABLE,
          Item: item,
        }),
      );
      console.log(`  upserted`);
    }
  }

  if (!APPLY) {
    console.log("\nDry-run only. Re-run with --apply to write to DynamoDB.");
  } else {
    console.log("\nDone.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
