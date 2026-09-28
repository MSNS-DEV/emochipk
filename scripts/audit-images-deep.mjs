import dotenv from 'dotenv';
import pg from 'pg';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import fs from 'fs';

dotenv.config();

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

async function run() {
  await dbClient.connect();
  console.log('✅ Connected to DB');

  // 1. Fetch all products
  const productsRes = await dbClient.query('SELECT id, "articleNumber", name, slug, category FROM products');
  const products = productsRes.rows;
  console.log(`Total products in DB: ${products.length}`);

  // 2. Fetch all product_images
  const imagesRes = await dbClient.query('SELECT id, "productId", url, "isPrimary" FROM product_images');
  const dbImages = imagesRes.rows;
  console.log(`Total images in product_images table: ${dbImages.length}`);

  const productsWithImages = new Set(dbImages.map(img => img.productId));
  console.log(`Products with at least one image: ${productsWithImages.size}`);
  console.log(`Products without any image: ${products.length - productsWithImages.size}`);

  // 3. List all objects in Cloudflare R2
  console.log('\nFetching objects from Cloudflare R2 bucket:', bucket);
  let r2Objects = [];
  let continuationToken = undefined;
  do {
    const listRes = await s3.send(new ListObjectsV2Command({
      Bucket: bucket,
      ContinuationToken: continuationToken,
    }));
    if (listRes.Contents) {
      r2Objects.push(...listRes.Contents);
    }
    continuationToken = listRes.NextContinuationToken;
  } while (continuationToken);

  console.log(`Total objects in R2 bucket: ${r2Objects.length}`);

  // 4. Analyze R2 objects
  const r2Keys = r2Objects.map(o => o.Key);
  
  // Set of keys or filenames in DB
  const dbUrls = new Set(dbImages.map(img => img.url));
  
  // Check how many R2 keys are in DB
  let matchedInDb = 0;
  let missingFromDb = [];

  for (const key of r2Keys) {
    // DB urls might be https://executivemochi.pk/api/images/${key} or similar
    const fullUrl = `https://executivemochi.pk/api/images/${key}`;
    const found = dbImages.some(img => img.url === fullUrl || img.url.endsWith(key) || img.url === key);
    if (found) {
      matchedInDb++;
    } else {
      missingFromDb.push(key);
    }
  }

  console.log(`R2 objects already linked in DB: ${matchedInDb}`);
  console.log(`R2 objects NOT currently linked in DB: ${missingFromDb.length}`);

  // 5. Try matching missing R2 objects to products
  // Build lookup maps for products
  const productByArticle = new Map();
  const productByCleanArticle = new Map();
  for (const p of products) {
    if (p.articleNumber) {
      productByArticle.set(p.articleNumber.toUpperCase().trim(), p);
      productByCleanArticle.set(p.articleNumber.toUpperCase().replace(/[^A-Z0-9]/g, ''), p);
    }
  }

  console.log('\n--- Analyzing Missing R2 Objects ---');
  let matchCount = 0;
  let unmatchable = [];
  const matches = [];

  for (const key of missingFromDb) {
    // Example keys:
    // products/EM-GC-001-Gents_Chappal_Memory_Foam_Sole.jpg
    // products/BAT-8771055-10-Bata_Gents_PVC_EVA_-_8771055-10.jpg
    // products/1777138157403-139746.jpg
    const filename = key.replace(/^products\//, '');
    
    // Check if starts with an articleNumber
    let matchedProduct = null;

    // Direct prefix match against all articleNumbers
    for (const [art, prod] of productByArticle.entries()) {
      if (filename.toUpperCase().startsWith(art)) {
        matchedProduct = prod;
        break;
      }
    }

    if (!matchedProduct) {
      // Try split by '-' or '_'
      const parts = filename.split(/[-_]/);
      for (let i = parts.length; i >= 1; i--) {
        const candidate = parts.slice(0, i).join('-').toUpperCase();
        if (productByArticle.has(candidate)) {
          matchedProduct = productByArticle.get(candidate);
          break;
        }
      }
    }

    if (matchedProduct) {
      matchCount++;
      matches.push({
        key,
        productId: matchedProduct.id,
        articleNumber: matchedProduct.articleNumber,
        productName: matchedProduct.name,
        alreadyHasImages: productsWithImages.has(matchedProduct.id)
      });
    } else {
      unmatchable.push(key);
    }
  }

  console.log(`Successfully matched missing R2 objects to products: ${matchCount}`);
  console.log(`Unmatchable missing R2 objects: ${unmatchable.length}`);
  console.log('Sample matches:');
  console.log(matches.slice(0, 10));

  console.log('\nUnmatchable keys (first 20):');
  console.log(unmatchable.slice(0, 20));

  // 6. Check manifest.json
  if (fs.existsSync('backups/old-bucket-data/manifest.json')) {
    const manifest = JSON.parse(fs.readFileSync('backups/old-bucket-data/manifest.json', 'utf8'));
    console.log('\n--- Checking manifest.json (10 items) ---');
    for (const item of manifest) {
      const inDb = dbImages.some(img => img.id === item.id || img.url.includes(item.filename));
      console.log(`Manifest item ${item.id} (${item.key}) -> In DB: ${inDb}, Target ProductId: ${item.productId}`);
    }
  }

  // 7. Check accessories
  const accWithoutImg = products.filter(p => p.category === 'ACCESSORIES' && !productsWithImages.has(p.id));
  console.log(`\nAccessories products without images in DB: ${accWithoutImg.length}`);
  for (const p of accWithoutImg) {
    console.log(`- ${p.articleNumber}: ${p.name}`);
  }

  await dbClient.end();
}

run().catch(console.error);
