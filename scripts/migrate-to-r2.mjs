import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();
const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MANIFEST_PATH = path.join(__dirname, '../backups/old-bucket-data/manifest.json');
const DB_URL =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL;

if (!DB_URL) {
  throw new Error("DATABASE_URL is required to run migrate-to-r2.");
}

const s3Endpoint = process.env.S3_ENDPOINT || 'https://c678cf5c0fc5ef3806edacc18e6a762d.r2.cloudflarestorage.com/emochipk';
let bucket = process.env.S3_BUCKET_NAME || 'emochipk';
const region = process.env.S3_REGION || 'auto';
const accessKeyId = process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://executivemochi.pk').replace(/\/$/, '');

// Parse S3Client endpoint (origin) and bucket name
let clientEndpoint = s3Endpoint;
try {
  const urlObj = new URL(s3Endpoint);
  if (urlObj.pathname && urlObj.pathname !== '/') {
    clientEndpoint = urlObj.origin;
    const pathBucket = urlObj.pathname.replace(/^\/+|\/+$/g, '');
    if (pathBucket) bucket = pathBucket;
  }
} catch (_e) {}

async function main() {
  console.log('🚀 Cloudflare R2 Migration Script for Emochipk');
  console.log(`Full S3 Endpoint: ${s3Endpoint}`);
  console.log(`S3 Client Origin: ${clientEndpoint}`);
  console.log(`Bucket Name: ${bucket}`);

  if (!accessKeyId || !secretAccessKey || accessKeyId === 'YOUR_R2_ACCESS_KEY_ID') {
    console.error('❌ Missing or placeholder S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY in environment!');
    console.error('Please set valid Cloudflare R2 credentials in .env and rerun this script.');
    process.exit(1);
  }

  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error(`❌ Manifest not found at ${MANIFEST_PATH}. Run scripts/backup-images.mjs first.`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  console.log(`Loaded ${manifest.length} images from backup manifest.`);

  const s3 = new S3Client({
    endpoint: clientEndpoint,
    region,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });

  const dbClient = new Client({ connectionString: DB_URL });
  await dbClient.connect();
  console.log('✅ Connected to PostgreSQL Database');

  let uploadedCount = 0;
  let dbUpdatedCount = 0;

  for (const item of manifest) {
    const filePath = item.localPath;
    if (!fs.existsSync(filePath)) {
      console.warn(`  ⚠️ Backup file missing: ${filePath}`);
      continue;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const s3Key = item.key || `products/${item.filename}`;

    console.log(`\nUploading [${item.id}] -> R2 Key: ${s3Key} (${fileBuffer.length} bytes)...`);

    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: s3Key,
          Body: fileBuffer,
          ContentType: item.contentType || 'image/jpeg',
        })
      );
      uploadedCount++;
      console.log(`  ✅ Uploaded to R2 successfully`);

      const newPublicUrl = `${appUrl}/api/images/${s3Key}`;
      await dbClient.query('UPDATE product_images SET url = $1 WHERE id = $2', [newPublicUrl, item.id]);
      dbUpdatedCount++;
      console.log(`  ✅ Database updated with URL: ${newPublicUrl}`);
    } catch (err) {
      console.error(`  ❌ Failed to migrate ${item.id}:`, err.message);
    }
  }

  console.log('\n==================================================');
  console.log(`🎉 Migration Completed!`);
  console.log(`   R2 Uploads: ${uploadedCount}/${manifest.length}`);
  console.log(`   Database Updates: ${dbUpdatedCount}/${manifest.length}`);
  console.log('==================================================');

  await dbClient.end();
}

main().catch(e => {
  console.error('Fatal migration error:', e);
  process.exit(1);
});
