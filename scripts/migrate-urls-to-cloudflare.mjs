// @ts-nocheck
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Client } = pg;
const dbUrl =
  process.env.DATABASE_URL_DEV ||
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_si9fM8gyAZCx@ep-young-scene-a1czywn2-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

const targetCdnUrl = (
  process.env.NEXT_PUBLIC_IMAGE_URL ||
  process.env.R2_PUBLIC_URL ||
  process.argv[2] ||
  ''
).replace(/\/$/, '');

async function main() {
  console.log('🚀 Cloudflare R2 Database Image URL Migration Tool');
  console.log(`Database: ${dbUrl.replace(/:[^:@]+@/, ':****@')}`);
  console.log(`Target CDN Domain: ${targetCdnUrl || '(none specified - use: node scripts/migrate-urls-to-cloudflare.mjs https://images.executivemochi.pk)'}`);

  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  console.log('✅ Connected to Database');

  const res = await client.query('SELECT id, url FROM product_images');
  console.log(`Total images in database: ${res.rows.length}`);

  if (!targetCdnUrl) {
    console.log('\nCurrent URL summary:');
    const summary = await client.query(`
      SELECT 
        CASE 
          WHEN url LIKE 'http%' THEN substring(url from '^https?://[^/]+')
          ELSE 'relative/other'
        END as host,
        count(*) as count
      FROM product_images
      GROUP BY host
    `);
    console.table(summary.rows);
    console.log('\n💡 To rewrite image URLs to a direct Cloudflare R2 public domain, pass the URL:');
    console.log('   node scripts/migrate-urls-to-cloudflare.mjs https://images.executivemochi.pk');
    console.log('   or set NEXT_PUBLIC_IMAGE_URL in .env');
    await client.end();
    return;
  }

  const targetPrefix = `${targetCdnUrl}/`;
  const toMigrate = res.rows.filter(r => !r.url.startsWith(targetPrefix));

  console.log(`Images needing URL rewrite to "${targetPrefix}": ${toMigrate.length}`);

  if (toMigrate.length === 0) {
    console.log('✨ All images are already using the target Cloudflare domain!');
    await client.end();
    return;
  }

  let updated = 0;
  for (const img of toMigrate) {
    let key = img.url;
    if (img.url.includes('/api/images/')) {
      key = img.url.substring(img.url.indexOf('/api/images/') + '/api/images/'.length);
    } else {
      try {
        const u = new URL(img.url);
        key = u.pathname.replace(/^\/+/, '');
        if (process.env.S3_BUCKET_NAME && key.startsWith(`${process.env.S3_BUCKET_NAME}/`)) {
          key = key.substring(process.env.S3_BUCKET_NAME.length + 1);
        }
      } catch (_e) {
        key = img.url.replace(/^\/+/, '');
      }
    }

    const newUrl = `${targetPrefix}${key.replace(/^\/+/, '')}`;
    await client.query('UPDATE product_images SET url = $1 WHERE id = $2', [newUrl, img.id]);
    updated++;
  }

  console.log(`\n🎉 Successfully migrated ${updated} image URLs to direct Cloudflare domain: ${targetCdnUrl}`);
  await client.end();
}

main().catch(err => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
