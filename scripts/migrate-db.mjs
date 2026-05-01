/**
 * migrate-db.mjs
 * Copies all data from Neon (source) → Railway (destination) PostgreSQL.
 * Run with: node scripts/migrate-db.mjs
 */

import pg from 'pg';
const { Client } = pg;

// ─── Connection strings ───────────────────────────────────────────────────────
const SOURCE_URL =
  'postgresql://neondb_owner:npg_si9fM8gyAZCx@ep-young-scene-a1czywn2-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const DEST_URL =
  'postgresql://postgres:kPvafiLoQgkeHXhaCVeAamZEwziaQEEx@switchback.proxy.rlwy.net:17158/railway';

// ─── Table order respects FK dependencies ────────────────────────────────────
// Parents before children. Leaf/junction tables at the end.
const TABLES = [
  // Core independent
  'users',
  'branches',

  // Depend on users/branches
  'branch_managers',   // userId, branchId
  'customers',         // userId

  // Products
  'products',
  'product_variants',  // productId
  'product_images',    // productId

  // Inventory
  'inventory',               // branchId, variantId
  'inventory_transactions',  // variantId
  'stock_transfers',         // branchId x2
  'stock_transfer_items',    // transferId
  'stock_adjustments',       // variantId, userId

  // Addresses
  'addresses',         // customerId

  // Orders
  'orders',            // userId, customerId, branchId
  'order_items',       // orderId, variantId
  'shipping_addresses',// orderId

  // Customer features
  'cart_items',        // userId, customerId, variantId
  'wishlist_items',    // userId, customerId, productId
  'size_preferences',  // customerId

  // Returns
  'return_requests',   // orderId, customerId, userId
  'return_items',      // returnRequestId
  'store_credits',     // customerId, returnRequestId

  // Reviews
  'reviews',           // productId, customerId, orderId
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`); }
function err(msg) { console.error(`[${new Date().toISOString()}] ❌ ${msg}`); }

async function copyTable(src, dst, table) {
  // Fetch all rows from source
  const { rows } = await src.query(`SELECT * FROM "${table}"`);
  if (rows.length === 0) {
    log(`  ${table}: 0 rows — skipping`);
    return;
  }

  const columns = Object.keys(rows[0]);
  const colList = columns.map(c => `"${c}"`).join(', ');

  // Build parameterized INSERT … ON CONFLICT DO NOTHING (idempotent)
  let inserted = 0;
  for (const row of rows) {
    const values = columns.map(c => row[c]);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const sql = `INSERT INTO "${table}" (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
    try {
      await dst.query(sql, values);
      inserted++;
    } catch (e) {
      err(`${table} row failed: ${e.message}`);
      err(`  Row: ${JSON.stringify(row)}`);
    }
  }
  log(`  ${table}: ${inserted}/${rows.length} rows copied`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const src = new Client({ connectionString: SOURCE_URL });
  const dst = new Client({ connectionString: DEST_URL });

  log('Connecting to source (Neon)...');
  await src.connect();
  log('Connecting to destination (Railway)...');
  await dst.connect();

  // Temporarily disable FK checks on destination for clean import
  await dst.query('SET session_replication_role = replica');
  log('FK constraints disabled on destination (session_replication_role = replica)');

  log(`\nMigrating ${TABLES.length} tables...\n`);
  for (const table of TABLES) {
    try {
      await copyTable(src, dst, table);
    } catch (e) {
      err(`Failed on table ${table}: ${e.message}`);
    }
  }

  // Re-enable FK checks
  await dst.query('SET session_replication_role = DEFAULT');
  log('\nFK constraints re-enabled');

  await src.end();
  await dst.end();
  log('\n✅ Migration complete!');
}

main().catch(e => {
  err(`Fatal: ${e.message}`);
  process.exit(1);
});
