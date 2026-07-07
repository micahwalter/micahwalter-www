/**
 * S3 ObjectCreated trigger on uploads/incoming/*
 *
 * The end-to-end worker: it takes a freshly-uploaded original and reproduces
 * the entire CLI pipeline (EXIF extraction → resize → S3 upload → MDX post),
 * then commits the post to the repo, which triggers the normal site deploy.
 *
 *   1. download the original from the uploads bucket
 *   2. extract EXIF + dimensions
 *   3. generate 400/800/1200 WebP+JPEG and upload to the images bucket
 *   4. upload the original to images/originals/...
 *   5. read + bump content/post-counter from the repo to assign the post id
 *   6. commit index.md + the bumped counter in one commit
 *   7. delete the incoming object
 */

const path = require('path');
const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');

const { getSecret } = require('./lib/secrets');
const { extractExif } = require('./lib/exif');
const { optimize } = require('./lib/optimize');
const { generateSlug, titleFromFilename, todayDate, buildFrontmatter } = require('./lib/slug');
const { getTextFile, commitFiles } = require('./lib/github');

const s3 = new S3Client({});

const IMAGES_BUCKET = process.env.IMAGES_BUCKET;
const GITHUB_REPO = process.env.GITHUB_REPO;       // "owner/name"
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
const CACHE_CONTROL = 'public, max-age=31536000, immutable';
const COUNTER_PATH = 'content/post-counter';

async function streamToBuffer(stream) {
  const bytes = await stream.transformToByteArray();
  return Buffer.from(bytes);
}

async function processObject(bucket, key) {
  console.log(`Processing s3://${bucket}/${key}`);

  const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const buffer = await streamToBuffer(obj.Body);
  const metadata = obj.Metadata || {};

  const origFilename = metadata['orig-filename'] || path.basename(key);
  const titleMeta = metadata.title
    ? Buffer.from(metadata.title, 'base64').toString('utf8').trim()
    : '';
  const featured = metadata.featured === 'true';

  const ext = (path.extname(origFilename) || '.jpg').toLowerCase();
  const photoFilename = `photo${ext}`;

  // Derive folder + slug exactly like the CLI: YYYY-MM-DD-<slug-from-filename>.
  const date = todayDate();
  const slug = generateSlug(origFilename);
  const folder = `${date}-${slug}`;

  // 2. EXIF + dimensions
  const exif = await extractExif(buffer);

  // 3 + 4. resize and upload everything (processed variants + original) in
  // parallel — they are independent, so there's no reason to serialize them.
  const variants = await optimize(buffer, 'photo');
  await Promise.all([
    ...variants.map((v) =>
      s3.send(new PutObjectCommand({
        Bucket: IMAGES_BUCKET,
        Key: `images/posts/${folder}/${v.filename}`,
        Body: v.body,
        ContentType: v.contentType,
        CacheControl: CACHE_CONTROL,
      }))
    ),
    s3.send(new PutObjectCommand({
      Bucket: IMAGES_BUCKET,
      Key: `images/originals/posts/${folder}/${photoFilename}`,
      Body: buffer,
      ContentType: obj.ContentType || 'application/octet-stream',
      CacheControl: CACHE_CONTROL,
    })),
  ]);

  // 5 + 6. Assign the post id by reading + bumping the repo's counter, then
  // commit the post in one commit. Two near-simultaneous uploads can read the
  // same counter; the loser's non-fast-forward ref update fails, so retry the
  // whole read→build→commit sequence (re-reading the counter each time) with
  // backoff. Pushing to the branch triggers the existing deploy workflow.
  const secret = await getSecret();
  const token = secret.githubToken;
  const title = titleMeta || titleFromFilename(origFilename);
  const excerpt = exif.camera ? `Photo taken with ${exif.camera}` : 'A new photo';

  const MAX_ATTEMPTS = 4;
  let committed;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const counterRaw = await getTextFile(token, GITHUB_REPO, GITHUB_BRANCH, COUNTER_PATH);
    const id = (parseInt((counterRaw || '0').trim(), 10) || 0) + 1;

    const indexMd = buildFrontmatter({
      id, title, date, excerpt,
      category: 'Photography',
      tags: ['photography'],
      photoFilename, featured, exif,
    });

    try {
      const commitSha = await commitFiles({
        token,
        repo: GITHUB_REPO,
        branch: GITHUB_BRANCH,
        message: `Add photo post: ${title} (#${id})${featured ? ' [featured]' : ''}`,
        files: [
          { path: `content/posts/${folder}/index.md`, content: indexMd },
          { path: COUNTER_PATH, content: String(id) },
        ],
      });
      committed = { commitSha, id };
      break;
    } catch (err) {
      if (attempt === MAX_ATTEMPTS) throw err;
      const delay = 250 * 2 ** (attempt - 1); // 250ms, 500ms, 1s
      console.warn(`Commit attempt ${attempt} failed (${err.message}); retrying in ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  console.log(`Committed ${committed.commitSha} — post id ${committed.id}, folder ${folder}`);

  // 7. clean up the incoming original
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

exports.handler = async (event) => {
  for (const record of event.Records || []) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    if (!key.startsWith('uploads/incoming/')) {
      console.log(`Skipping unexpected key: ${key}`);
      continue;
    }
    await processObject(bucket, key);
  }
  return { ok: true };
};
