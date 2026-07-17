#!/usr/bin/env node
/**
 * Migrate photo markdown under content/posts (type: photo) into DynamoDB
 * table micahwalter-photos.
 *
 * Usage:
 *   node scripts/migrate-photos.js              # dry-run
 *   node scripts/migrate-photos.js --apply      # write
 *   node scripts/migrate-photos.js --apply --gps  # also backfill GPS from S3 originals
 *
 * Env:
 *   PHOTOS_TABLE (default micahwalter-photos)
 *   IMAGES_BUCKET (default micahwalter-www-images)
 *   AWS_PROFILE / AWS_REGION (default us-east-1)
 */

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

const APPLY = process.argv.includes("--apply");
const DO_GPS = process.argv.includes("--gps");
const TABLE = process.env.PHOTOS_TABLE || "micahwalter-photos";
const IMAGES_BUCKET = process.env.IMAGES_BUCKET || "micahwalter-www-images";
const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const ROOT = path.join(__dirname, "..", "content", "posts");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }), {
  marshallOptions: { removeUndefinedValues: true },
});
const s3 = new S3Client({ region: REGION });

function nowIso() {
  return new Date().toISOString();
}

function gsiKeys(publishedAt, id) {
  return {
    gsi1pk: "PHOTO",
    gsi1sk: `${publishedAt}#${id}`,
  };
}

function coverFilename(coverImage) {
  if (!coverImage) return "photo.jpg";
  return path.basename(String(coverImage).replace(/^\.\//, ""));
}

function loadPhotos() {
  if (!fs.existsSync(ROOT)) return [];
  const out = [];
  for (const folder of fs.readdirSync(ROOT)) {
    const fullPath = path.join(ROOT, folder, "index.md");
    if (!fs.existsSync(fullPath)) continue;
    const { data, content } = matter(fs.readFileSync(fullPath, "utf8"));
    if (data.type !== "photo") continue;
    if (data.id == null || data.id === "") {
      out.push({ error: "missing id", folder, fullPath });
      continue;
    }
    const id = String(data.id);
    const publishedAt = String(data.publishedAt || nowIso().slice(0, 10));
    const file = coverFilename(data.coverImage);
    const now = nowIso();
    const caption =
      (content && String(content).trim()) ||
      String(data.excerpt || "") ||
      "";
    const exif = {};
    for (const k of [
      "camera",
      "lens",
      "aperture",
      "shutterSpeed",
      "iso",
      "focalLength",
      "dateTaken",
      "width",
      "height",
    ]) {
      if (data[k] != null && data[k] !== "") exif[k] = data[k];
    }
    out.push({
      id,
      ...gsiKeys(publishedAt, id),
      title: String(data.title || folder),
      caption,
      publishedAt,
      createdAt: now,
      updatedAt: now,
      featured: !!data.featured,
      draft: !!data.draft,
      tags: Array.isArray(data.tags) ? data.tags.map(String) : ["photography"],
      enrichmentStatus: "pending",
      folderName: folder,
      coverImageKey: `images/posts/${folder}/${file}`,
      originalKey: `images/originals/posts/${folder}/${file}`,
      category: String(data.category || "Photography"),
      exif,
      latitude: null,
      longitude: null,
      publicLatitude: null,
      publicLongitude: null,
      _source: fullPath,
    });
  }
  return out;
}

async function streamToBuffer(stream) {
  const bytes = await stream.transformToByteArray();
  return Buffer.from(bytes);
}

async function backfillGps(item) {
  // Lazy-load exif helper from lambda package if present
  let extractGps;
  try {
    ({ extractGps } = require("../infra/photo-upload-lambdas/src/lib/exif"));
  } catch {
    return item;
  }
  const candidates = [
    item.originalKey,
    item.originalKey.replace(/\.jpeg$/i, ".jpg"),
    item.originalKey.replace(/\.jpg$/i, ".jpeg"),
  ];
  for (const key of candidates) {
    try {
      const obj = await s3.send(
        new GetObjectCommand({ Bucket: IMAGES_BUCKET, Key: key }),
      );
      const buf = await streamToBuffer(obj.Body);
      const gps = extractGps(buf);
      if (gps && gps.latitude != null && gps.longitude != null) {
        item.latitude = gps.latitude;
        item.longitude = gps.longitude;
        item.enrichmentStatus = "pending";
        console.log(`  GPS from s3://${IMAGES_BUCKET}/${key}`);
        return item;
      }
    } catch {
      /* try next */
    }
  }
  return item;
}

async function main() {
  const photos = loadPhotos();
  const valid = photos.filter((p) => !p.error);
  const invalid = photos.filter((p) => p.error);

  console.log(`Found ${valid.length} photo post(s) under content/posts`);
  if (invalid.length) {
    console.log(`Skipped ${invalid.length} without id:`);
    for (const p of invalid) console.log(`  - ${p.folder}: ${p.error}`);
  }
  console.log(
    `Table: ${TABLE}  Region: ${REGION}  Mode: ${APPLY ? "APPLY" : "DRY-RUN"}${DO_GPS ? " +GPS" : ""}`,
  );

  let applied = 0;
  let failed = 0;

  for (const raw of valid) {
    let item = { ...raw };
    const source = item._source;
    delete item._source;
    console.log(
      `- ${item.id}: ${item.title} (${item.folderName})${item.draft ? " [draft]" : ""}${item.featured ? " [featured]" : ""}`,
    );
    console.log(`  source: ${source}`);
    if (DO_GPS && APPLY) {
      item = await backfillGps(item);
    }
    if (APPLY) {
      try {
        await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));
        console.log("  upserted");
        applied++;
      } catch (err) {
        console.error(`  FAILED: ${err.message}`);
        failed++;
      }
    }
  }

  if (!APPLY) {
    console.log("\nDry-run only. Re-run with --apply to write to DynamoDB.");
    console.log("Optional: --apply --gps to backfill GPS from S3 originals.");
  } else {
    console.log(`\nDone. applied=${applied} failed=${failed}`);
    if (failed) process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
