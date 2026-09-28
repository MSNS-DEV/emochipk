import dotenv from 'dotenv';
import pg from 'pg';
import { S3Client, PutObjectCommand, HeadObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const dbUrl =
  process.env.STORAGE_POSTGRES_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.DIRECT_URL;

const rawEndpoint =
  process.env.S3_ENDPOINT ||
  process.env.AWS_ENDPOINT_URL ||
  process.env.AWS_S3_ENDPOINT_URL;

const accessKeyId =
  process.env.S3_ACCESS_KEY_ID ||
  process.env.AWS_ACCESS_KEY_ID;

const secretAccessKey =
  process.env.S3_SECRET_ACCESS_KEY ||
  process.env.AWS_SECRET_ACCESS_KEY;

const region = process.env.S3_REGION || 'auto';
let bucket = process.env.S3_BUCKET_NAME || 'emochipk';

let clientEndpoint = rawEndpoint;
try {
  const urlObj = new URL(rawEndpoint);
  if (urlObj.pathname && urlObj.pathname !== '/') {
    clientEndpoint = urlObj.origin;
    const pathBucket = urlObj.pathname.replace(/^\/+|\/+$/g, '');
    if (pathBucket) bucket = pathBucket;
  }
} catch (_e) {}

const s3 = new S3Client({
  endpoint: clientEndpoint,
  region,
  credentials: { accessKeyId, secretAccessKey },
  forcePathStyle: true,
});

const { Client } = pg;
const dbClient = new Client({ connectionString: dbUrl });

function genCuid(prefix = 'c') {
  return `${prefix}${randomUUID().replace(/-/g, '').substring(0, 24)}`;
}

async function main() {
  console.log('========================================================');
  console.log('🚀 Emochipk Product Image Synchronization Pipeline');
  console.log('========================================================\n');

  await dbClient.connect();
  console.log('✅ Connected to database: db.prisma.io:5432');

  // STEP 1: Upload missing local backup files to R2
  console.log('\n--- Step 1: Uploading missing local backup files to R2 ---');
  const backupFilesToUpload = [
    {
      localFile: path.join(__dirname, '../backups/old-bucket-data/1777137863477-2.jpg'),
      r2Key: 'products/1777137863477-2.jpg',
      contentType: 'image/jpeg'
    },
    {
      localFile: path.join(__dirname, '../backups/old-bucket-data/1777442270772-IMG20260207185806.jpg'),
      r2Key: 'products/1777442270772-IMG20260207185806.jpg',
      contentType: 'image/jpeg'
    }
  ];

  for (const item of backupFilesToUpload) {
    if (fs.existsSync(item.localFile)) {
      try {
        await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: item.r2Key }));
        console.log(`  ℹ️ Already exists in R2: ${item.r2Key}`);
      } catch (err) {
        console.log(`  📤 Uploading ${path.basename(item.localFile)} to R2 (${item.r2Key})...`);
        const body = fs.readFileSync(item.localFile);
        await s3.send(new PutObjectCommand({
          Bucket: bucket,
          Key: item.r2Key,
          Body: body,
          ContentType: item.contentType
        }));
        console.log(`  ✅ Successfully uploaded ${item.r2Key}`);
      }
    }
  }

  // STEP 2: Sync manifest.json images for product cmnng6n1600q3fz089ydbnd8y (X-W-XWL0084-25)
  console.log('\n--- Step 2: Syncing manifest.json images for product cmnng6n1600q3fz089ydbnd8y ---');
  const manifestPath = path.join(__dirname, '../backups/old-bucket-data/manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    let manifestAdded = 0;
    for (const item of manifest) {
      const fullUrl = `https://executivemochi.pk/api/images/${item.key}`;
      
      // Check if image already exists in DB
      const existing = await dbClient.query(
        'SELECT id FROM product_images WHERE id = $1 OR url = $2',
        [item.id, fullUrl]
      );

      if (existing.rows.length === 0) {
        // Check if product currently has any primary image
        const hasPrimary = await dbClient.query(
          'SELECT id FROM product_images WHERE "productId" = $1 AND "isPrimary" = true',
          [item.productId]
        );
        const shouldBePrimary = hasPrimary.rows.length === 0;

        await dbClient.query(`
          INSERT INTO product_images (id, "productId", url, "altText", "isPrimary", "colorTag", "sortOrder")
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO NOTHING;
        `, [
          item.id,
          item.productId,
          fullUrl,
          item.altText || null,
          shouldBePrimary,
          item.colorTag || null,
          item.sortOrder || 0
        ]);
        console.log(`  ✅ Inserted manifest image [${item.id}] for product [${item.productId}] (isPrimary: ${shouldBePrimary})`);
        manifestAdded++;
      } else {
        console.log(`  ℹ️ Manifest image [${item.id}] already in DB.`);
      }
    }
    console.log(`Manifest sync complete: ${manifestAdded} image(s) inserted.`);
  }

  // STEP 3: Fetch all R2 objects & current DB state
  console.log('\n--- Step 3: Fetching R2 objects and matching to products ---');
  let r2Objects = [];
  let continuationToken = undefined;
  do {
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: bucket,
      ContinuationToken: continuationToken,
    }));
    if (res.Contents) r2Objects.push(...res.Contents);
    continuationToken = res.NextContinuationToken;
  } while (continuationToken);

  console.log(`Total objects in R2: ${r2Objects.length}`);

  const productsRes = await dbClient.query('SELECT id, "articleNumber", name FROM products');
  const products = productsRes.rows;

  const currentDbImagesRes = await dbClient.query('SELECT id, "productId", url, "isPrimary" FROM product_images');
  const currentDbImages = currentDbImagesRes.rows;
  const currentDbUrls = new Set(currentDbImages.map(img => img.url));

  const productByArt = new Map();
  for (const p of products) {
    if (p.articleNumber) {
      productByArt.set(p.articleNumber.toUpperCase().trim(), p);
    }
  }

  // Filter unlinked R2 product images
  const unlinkedKeys = r2Objects
    .map(o => o.Key)
    .filter(k => k.startsWith('products/'))
    .filter(k => {
      const fullUrl = `https://executivemochi.pk/api/images/${k}`;
      return !currentDbImages.some(img => img.url === fullUrl || img.url.endsWith(k));
    });

  console.log(`Unlinked R2 product keys remaining: ${unlinkedKeys.length}`);

  let matchedSyncCount = 0;
  for (const key of unlinkedKeys) {
    const filename = key.replace(/^products\//, '');
    let matchedProduct = null;

    // Match exact prefix
    for (const [art, p] of productByArt.entries()) {
      if (filename.toUpperCase().startsWith(art)) {
        matchedProduct = p;
        break;
      }
    }

    if (!matchedProduct) {
      const parts = filename.split(/[-_]/);
      for (let i = parts.length; i >= 1; i--) {
        const candidate = parts.slice(0, i).join('-').toUpperCase();
        if (productByArt.has(candidate)) {
          matchedProduct = productByArt.get(candidate);
          break;
        }
      }
    }

    if (matchedProduct) {
      const fullUrl = `https://executivemochi.pk/api/images/${key}`;
      
      // Determine if product already has primary image
      const primaryCheck = await dbClient.query(
        'SELECT id FROM product_images WHERE "productId" = $1 AND "isPrimary" = true',
        [matchedProduct.id]
      );
      const isPrimary = primaryCheck.rows.length === 0;

      const newId = genCuid('cm');
      await dbClient.query(`
        INSERT INTO product_images (id, "productId", url, "altText", "isPrimary", "sortOrder")
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING;
      `, [
        newId,
        matchedProduct.id,
        fullUrl,
        matchedProduct.name,
        isPrimary,
        0
      ]);

      console.log(`  ✅ Synced [${matchedProduct.articleNumber}] -> ${key} (isPrimary: ${isPrimary})`);
      matchedSyncCount++;
    }
  }

  console.log(`\nMatched R2 images sync complete: ${matchedSyncCount} image(s) inserted.`);

  // STEP 4: Comprehensive Database Image Linkage Verification
  console.log('\n--- Step 4: Final Verification ---');
  const finalImagesRes = await dbClient.query('SELECT count(*) as total_images FROM product_images');
  const finalDistinctProductsRes = await dbClient.query('SELECT count(DISTINCT "productId") as distinct_prods FROM product_images');
  const finalPrimaryRes = await dbClient.query('SELECT count(*) as total_primary FROM product_images WHERE "isPrimary" = true');

  console.log(`Total images in product_images: ${finalImagesRes.rows[0].total_images}`);
  console.log(`Distinct products with images: ${finalDistinctProductsRes.rows[0].distinct_prods} / ${products.length}`);
  console.log(`Total primary images: ${finalPrimaryRes.rows[0].total_primary}`);

  // Test sample products that were previously missing images
  const sampleArticles = ['EM-GC-001', 'EM-GP-001', 'EM-GS-001', 'EM-LC-001', 'BAT-8771055-10', 'X-W-XWL0084-25'];
  console.log('\nSample verified products:');
  for (const art of sampleArticles) {
    const res = await dbClient.query(`
      SELECT p."articleNumber", p.name, pi.url, pi."isPrimary"
      FROM products p
      JOIN product_images pi ON p.id = pi."productId"
      WHERE p."articleNumber" = $1;
    `, [art]);
    console.log(`Product ${art}: ${res.rows.length} image(s) found`);
    res.rows.forEach(r => console.log(`   - [primary=${r.isPrimary}] ${r.url}`));
  }

  console.log('\n========================================================');
  console.log('🎉 Product Image Synchronization Complete!');
  console.log('========================================================');

  await dbClient.end();
}

main().catch(err => {
  console.error('Fatal error during image sync:', err);
  process.exit(1);
});
