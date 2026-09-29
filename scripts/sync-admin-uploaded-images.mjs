import dotenv from 'dotenv';
import pg from 'pg';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const dbUrl =
  process.env.STORAGE_POSTGRES_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL;

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

function genCuid(prefix = 'cmu') {
  return `${prefix}${crypto.randomUUID().replace(/-/g, '').substring(0, 22)}`;
}

async function main() {
  console.log('========================================================');
  console.log('🔄 Syncing Admin Uploaded Images & Recalibrating Primary Images');
  console.log('========================================================\n');

  await dbClient.connect();
  console.log('✅ Connected to database: ' + dbUrl.replace(/:[^:@]+@/, ':****@'));

  // 1. Fetch current DB state
  const products = (await dbClient.query('SELECT id, "articleNumber", name FROM products')).rows;
  const currentImages = (await dbClient.query('SELECT id, "productId", url, "isPrimary" FROM product_images')).rows;
  console.log(`Current DB: ${products.length} products, ${currentImages.length} images.`);

  // 2. Fetch all R2 objects
  let r2Objects = [];
  let token = undefined;
  do {
    const res = await s3.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token }));
    if (res.Contents) r2Objects.push(...res.Contents);
    token = res.NextContinuationToken;
  } while (token);
  console.log(`Cloudflare R2 Bucket: ${r2Objects.length} total objects.`);

  // 3. Find unlinked R2 objects
  const unlinked = r2Objects.filter(o => {
    if (!o.Key.startsWith('products/')) return false;
    const fullUrl = `https://executivemochi.pk/api/images/${o.Key}`;
    return !currentImages.some(img => img.url === fullUrl || img.url.endsWith(o.Key) || img.url === o.Key);
  });
  console.log(`Unlinked R2 product images: ${unlinked.length}`);

  // 4. Map unlinked objects to products
  // Strategy A: Match by file suffix with existing linked image of the same batch/product
  // Strategy B: Explicit article number / naming patterns
  const toInsert = [];

  for (const o of unlinked) {
    const fullUrl = `https://executivemochi.pk/api/images/${o.Key}`;
    let matchedProductId = null;
    let matchedName = '';
    let matchedArticle = '';

    // Match exact suffix (e.g. same camera photo or WhatsApp image timestamp)
    const match = o.Key.match(/-([0-9a-f]{8}-)?(.+)$/);
    if (match) {
      const suffix = match[2];
      const found = currentImages.find(img => img.url.endsWith('-' + suffix) || img.url.endsWith('/' + suffix));
      if (found) {
        const prod = products.find(p => p.id === found.productId);
        if (prod) {
          matchedProductId = prod.id;
          matchedName = prod.name;
          matchedArticle = prod.articleNumber;
        }
      }
    }

    // Direct filename checks if not matched by suffix
    if (!matchedProductId) {
      if (o.Key.includes('0028_blk')) {
        const prod = products.find(p => p.articleNumber.trim() === 'CH-DI-0028-BLK');
        if (prod) {
          matchedProductId = prod.id;
          matchedName = prod.name;
          matchedArticle = prod.articleNumber;
        }
      } else if (o.Key.includes('0009__2_')) {
        const prod = products.find(p => p.articleNumber.trim() === 'CH-ZE-0009-BRN');
        if (prod) {
          matchedProductId = prod.id;
          matchedName = prod.name;
          matchedArticle = prod.articleNumber;
        }
      } else if (o.Key.includes('1790241914978')) {
        const prod = products.find(p => p.articleNumber.trim() === 'ESH-HM-9898-BLK');
        if (prod) {
          matchedProductId = prod.id;
          matchedName = prod.name;
          matchedArticle = prod.articleNumber;
        }
      }
    }

    if (matchedProductId) {
      toInsert.push({
        id: genCuid(),
        productId: matchedProductId,
        url: fullUrl,
        altText: matchedName || 'Product Image',
        articleNumber: matchedArticle,
      });
    }
  }

  console.log(`\nIdentified ${toInsert.length} unlinked R2 images matching existing products.`);

  let insertedCount = 0;
  for (const item of toInsert) {
    await dbClient.query(`
      INSERT INTO product_images (id, "productId", url, "altText", "isPrimary", "sortOrder")
      VALUES ($1, $2, $3, $4, false, 0)
      ON CONFLICT (id) DO NOTHING;
    `, [item.id, item.productId, item.url, item.altText]);
    insertedCount++;
    console.log(`  ✅ Linked [${item.articleNumber}] -> ${item.url}`);
  }

  console.log(`\nSuccessfully inserted ${insertedCount} images.`);

  // 5. CRITICAL FIX: Ensure EVERY product that has images has exactly ONE isPrimary = true
  console.log('\n--- Step 5: Recalibrating isPrimary for all products ---');
  
  // Find products that have images but NO primary image
  const noPrimaryRes = await dbClient.query(`
    SELECT p.id, p."articleNumber", count(pi.id) as count
    FROM products p
    JOIN product_images pi ON pi."productId" = p.id
    GROUP BY p.id
    HAVING count(CASE WHEN pi."isPrimary" = true THEN 1 END) = 0
  `);

  console.log(`Products with images but NO primary image: ${noPrimaryRes.rows.length}`);

  if (noPrimaryRes.rows.length > 0) {
    const updateRes = await dbClient.query(`
      WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER(PARTITION BY "productId" ORDER BY "sortOrder" ASC, id ASC) as rn
        FROM product_images
        WHERE "productId" IN (
          SELECT p.id
          FROM products p
          JOIN product_images pi ON pi."productId" = p.id
          GROUP BY p.id
          HAVING count(CASE WHEN pi."isPrimary" = true THEN 1 END) = 0
        )
      )
      UPDATE product_images
      SET "isPrimary" = true
      WHERE id IN (SELECT id FROM ranked WHERE rn = 1);
    `);
    console.log(`✅ Set primary image for ${updateRes.rowCount} products.`);
  }

  // Double check if any product has multiple primary images and ensure only 1 is primary
  const multiPrimaryRes = await dbClient.query(`
    SELECT "productId", count(*) as count
    FROM product_images
    WHERE "isPrimary" = true
    GROUP BY "productId"
    HAVING count(*) > 1
  `);

  if (multiPrimaryRes.rows.length > 0) {
    console.log(`Products with multiple primary images: ${multiPrimaryRes.rows.length}. Normalizing...`);
    await dbClient.query(`
      WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER(PARTITION BY "productId" ORDER BY "sortOrder" ASC, id ASC) as rn
        FROM product_images
        WHERE "isPrimary" = true
      )
      UPDATE product_images
      SET "isPrimary" = false
      WHERE id IN (SELECT id FROM ranked WHERE rn > 1);
    `);
    console.log(`✅ Normalized multiple primary images.`);
  }

  // 6. Final Statistics
  const finalImagesRes = await dbClient.query('SELECT count(*) as total FROM product_images');
  const finalPrimaryRes = await dbClient.query('SELECT count(*) as total FROM product_images WHERE "isPrimary" = true');
  const finalProdsWithImagesRes = await dbClient.query('SELECT count(DISTINCT "productId") as total FROM product_images');

  console.log('\n========================================================');
  console.log('📊 FINAL DATABASE IMAGE STATUS:');
  console.log(`Total images in product_images: ${finalImagesRes.rows[0].total}`);
  console.log(`Distinct products with images:  ${finalProdsWithImagesRes.rows[0].total} / ${products.length}`);
  console.log(`Total primary images:           ${finalPrimaryRes.rows[0].total}`);
  console.log('========================================================\n');

  await dbClient.end();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
