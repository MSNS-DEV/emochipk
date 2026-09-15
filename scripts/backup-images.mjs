import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_URL =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL;

if (!DB_URL) {
  throw new Error("DATABASE_URL is required to run backup-images.");
}

const BACKUP_DIR = path.join(__dirname, '../backups/old-bucket-data');

async function main() {
  console.log('🚀 Starting Product Image Backup Process...');
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  console.log('✅ Connected to Database');

  const res = await client.query('SELECT * FROM product_images');
  console.log(`Found ${res.rows.length} product images in database.`);

  const manifest = [];

  for (const img of res.rows) {
    console.log(`\nDownloading image [${img.id}] from: ${img.url}`);
    try {
      const resp = await fetch(img.url);
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
      }
      const arrayBuffer = await resp.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Determine filename from URL or key
      const urlPath = new URL(img.url).pathname;
      const basename = path.basename(urlPath) || `${img.id}.jpg`;
      const localFilePath = path.join(BACKUP_DIR, basename);

      fs.writeFileSync(localFilePath, buffer);
      console.log(`  Saved to ${localFilePath} (${buffer.length} bytes)`);

      manifest.push({
        id: img.id,
        productId: img.productId,
        originalUrl: img.url,
        key: `products/${basename}`,
        localPath: localFilePath,
        filename: basename,
        sizeBytes: buffer.length,
        contentType: resp.headers.get('content-type') || 'image/jpeg',
        isPrimary: img.isPrimary,
        altText: img.altText,
        colorTag: img.colorTag,
        sortOrder: img.sortOrder,
      });
    } catch (err) {
      console.error(`  ❌ Failed to download image ${img.id}:`, err.message);
    }
  }

  // Backup static product images from public/images/products if any
  const staticDir = path.join(__dirname, '../public/images/products');
  if (fs.existsSync(staticDir)) {
    const staticFiles = fs.readdirSync(staticDir);
    console.log(`\nBacking up ${staticFiles.length} static images from public/images/products...`);
    const staticBackupDir = path.join(BACKUP_DIR, 'static-products');
    if (!fs.existsSync(staticBackupDir)) {
      fs.mkdirSync(staticBackupDir, { recursive: true });
    }
    for (const f of staticFiles) {
      const srcFile = path.join(staticDir, f);
      const dstFile = path.join(staticBackupDir, f);
      fs.copyFileSync(srcFile, dstFile);
      console.log(`  Copied static image ${f}`);
    }
  }

  const manifestPath = path.join(BACKUP_DIR, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n🎉 Backup finished! ${manifest.length} database images backed up.`);
  console.log(`Manifest written to: ${manifestPath}`);

  await client.end();
}

main().catch(e => {
  console.error('Fatal backup error:', e);
  process.exit(1);
});
