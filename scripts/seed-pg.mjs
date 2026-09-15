import { readFileSync } from 'fs';
import path from 'path';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

dotenv.config();
const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_URL =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL;

if (!DB_URL) {
  throw new Error("DATABASE_URL or DIRECT_URL is required to run seed-pg.");
}

function genId(prefix = 'c') {
  return `${prefix}${randomUUID().replace(/-/g, '').substring(0, 24)}`;
}

// ─── Size Standards ─────────────────────────────────────────────────────────
const mensSizes = [
  { uk: '6', us: '7', eu: '39', cm: '24.5' },
  { uk: '7', us: '8', eu: '40', cm: '25.5' },
  { uk: '8', us: '9', eu: '42', cm: '26.5' },
  { uk: '9', us: '10', eu: '43', cm: '27.5' },
  { uk: '10', us: '11', eu: '44', cm: '28.5' },
  { uk: '11', us: '12', eu: '45', cm: '29.5' },
];

const womensSizes = [
  { uk: '3', us: '5.5', eu: '36', cm: '22.5' },
  { uk: '4', us: '6.5', eu: '37', cm: '23.5' },
  { uk: '5', us: '7.5', eu: '38', cm: '24.0' },
  { uk: '6', us: '8.5', eu: '39', cm: '24.5' },
  { uk: '7', us: '9.5', eu: '40', cm: '25.5' },
  { uk: '8', us: '10.5', eu: '41', cm: '26.0' },
];

const kidsSizes = [
  { uk: '10K', us: '11K', eu: '28', cm: '17.0' },
  { uk: '11K', us: '12K', eu: '29', cm: '17.5' },
  { uk: '12K', us: '13K', eu: '30', cm: '18.5' },
  { uk: '1', us: '2', eu: '33', cm: '20.5' },
  { uk: '2', us: '3', eu: '35', cm: '21.5' },
  { uk: '3', us: '4', eu: '36', cm: '22.5' },
];

function mapCategory(catName) {
  const lower = catName.toLowerCase();
  if (lower.includes('ladies') || lower.includes('girls')) return 'WOMEN';
  if (lower.includes('gents') || lower.includes('youth')) return 'MEN';
  if (lower.includes('boys') || lower.includes('child') || lower.includes('kids')) return 'KIDS';
  return 'MEN';
}

function mapStyle(catName) {
  const lower = catName.toLowerCase();
  if (lower.includes('sports') || lower.includes('jogger') || lower.includes('sneaker')) return 'SNEAKERS';
  if (lower.includes('peshawari')) return 'PESHAWARI';
  if (lower.includes('moccasin')) return 'MOCCASINS';
  if (lower.includes('sandal') || lower.includes('chappal') || lower.includes('pvc') || lower.includes('eva') || lower.includes('hawai')) return 'SANDALS';
  if (lower.includes('shoe') || lower.includes('oxford') || lower.includes('formal')) return 'OXFORD';
  if (lower.includes('loafer')) return 'LOAFERS';
  return 'SANDALS';
}

function mapOccasion(catName) {
  const lower = catName.toLowerCase();
  const occasions = [];
  if (lower.includes('sport') || lower.includes('jogger') || lower.includes('canvas')) occasions.push('SPORTS');
  if (lower.includes('peshawari')) { occasions.push('ETHNIC'); occasions.push('CASUAL'); }
  if (lower.includes('formal') || lower.includes('shoe') || lower.includes('moccasin') || lower.includes('oxford')) occasions.push('FORMAL');
  if (lower.includes('sandal') || lower.includes('chappal') || lower.includes('hawai') || lower.includes('pvc') || lower.includes('eva')) occasions.push('CASUAL');
  if (occasions.length === 0) occasions.push('CASUAL');
  return occasions;
}

function mapLeatherType(brand, catName) {
  const lower = catName.toLowerCase();
  if (lower.includes('pvc') || lower.includes('eva') || lower.includes('hawai')) return 'PREMIUM_SYNTHETIC';
  if (lower.includes('peshawari')) return 'GOAT_LEATHER';
  if (brand === 'Executive' || brand === 'Hush Puppies') return 'CALF_SKIN';
  return 'PREMIUM_SYNTHETIC';
}

function mapManufacturingCity(brand) {
  if (['Imported', 'Bata', 'Hush Puppies'].includes(brand)) return 'Imported';
  if (brand === 'Executive') return 'Pasrur';
  return 'Imported';
}

function mapColorHex(colorCode) {
  const map = {
    'BLK': '#1a1a1a', 'BLACK': '#1a1a1a', 'BRN': '#8B4513', 'BROWN': '#8B4513',
    'WHT': '#FFFFFF', 'WHITE': '#FFFFFF', 'BLUE': '#2980B9', 'NAVY': '#1a1a3e',
    'RED': '#C0392B', 'GRY': '#808080', 'GREY': '#808080', 'TAN': '#D2B48C'
  };
  return map[colorCode] || '#808080';
}

function mapColorName(colorCode) {
  const map = {
    'BLK': 'Black', 'BLACK': 'Black', 'BRN': 'Brown', 'BROWN': 'Brown',
    'WHT': 'White', 'WHITE': 'White', 'BLUE': 'Blue', 'NAVY': 'Navy',
    'RED': 'Red', 'GRY': 'Grey', 'GREY': 'Grey', 'TAN': 'Tan'
  };
  return map[colorCode] || colorCode;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

function categoryShort(catName) {
  if (catName.includes('Sports')) return 'Sports';
  if (catName.includes('Moccasin')) return 'Moccasin';
  if (catName.includes('Peshawari')) return 'Peshawari';
  if (catName.includes('Sandal')) return 'Sandal';
  if (catName.includes('Chappal')) return 'Chappal';
  return catName;
}

async function main() {
  console.log('🚀 Fast Batch Database Seeder for Executive Mochi Catalog...');
  const filePath = path.join(__dirname, '../stocktaking_categorized.md');
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  let currentBrand = '';
  let currentCatNum = '';
  let currentCatName = '';
  let rawProducts = [];
  let inTable = false;
  let headerSeen = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const brandMatch = trimmed.match(/^## (.+)$/);
    if (brandMatch) { currentBrand = brandMatch[1].trim(); continue; }
    
    const catMatch = trimmed.match(/^### (\d+) · (.+?) — (.+?)(?:\s*\(cont\.\))?$/);
    if (catMatch) {
      currentCatNum = catMatch[1];
      currentCatName = catMatch[3].trim();
      inTable = false; headerSeen = false; continue;
    }
    
    if (trimmed.startsWith('| Design #')) { inTable = true; headerSeen = false; continue; }
    if (trimmed.startsWith('| ---')) { headerSeen = true; continue; }
    
    if (inTable && headerSeen && trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed.split('|').map(c => c.trim()).filter(c => c);
      if (cells.length >= 3) {
        rawProducts.push({
          brand: currentBrand, catNum: currentCatNum, category: currentCatName,
          designNum: cells[0], color: cells[1], price: parseInt(cells[2], 10) || 0
        });
      }
    } else if (trimmed === '' || trimmed.startsWith('*Table')) {
    } else { inTable = false; headerSeen = false; }
  }

  const productMap = new Map();
  for (const row of rawProducts) {
    const key = `${row.brand}|${row.catNum}|${row.designNum}`;
    if (!productMap.has(key)) {
      productMap.set(key, {
        brand: row.brand, catNum: row.catNum, category: row.category,
        designNum: row.designNum, price: row.price, colors: new Map()
      });
    }
    const prod = productMap.get(key);
    if (row.price > prod.price) prod.price = row.price;
    if (!prod.colors.has(row.color)) prod.colors.set(row.color, row.price);
  }

  const articleCounts = {};
  for (const [, prod] of productMap) {
    articleCounts[prod.designNum] = (articleCounts[prod.designNum] || 0) + 1;
  }

  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  console.log('✅ Connected to PostgreSQL');

  // 1. Upsert Branches
  console.log('Upserting Branches...');
  await client.query(`
    INSERT INTO branches (id, name, city, address, landmark, phone, "managerName", "operatingHours", "isActive", "createdAt", "updatedAt")
    VALUES 
      ('branch-pasrur-01', 'Executive Mochi – Pasrur', 'Pasrur', 'Timber Market, Pasrur, Sialkot', 'Near Service Super Shoes', '+92-345-8760001', 'Branch Manager Pasrur', '10:00 AM – 9:00 PM', true, NOW(), NOW()),
      ('branch-daska-01', 'Executive Mochi – Daska', 'Daska', 'Kachehri Road, Daska, Sialkot', 'Near Service Super Shoes', '+92-345-8760002', 'Branch Manager Daska', '10:00 AM – 9:00 PM', true, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  `);

  // 2. Upsert Admin & Manager Users
  console.log('Upserting Users...');
  const adminHash = await bcrypt.hash('Admin@12345', 10);
  const bmHash = await bcrypt.hash('Manager@12345', 10);

  await client.query(`
    INSERT INTO users (id, email, password, name, role, "isActive", "createdAt", "updatedAt")
    VALUES ('user-admin-01', 'admin@executivemochi.pk', $1, 'Admin', 'ADMIN', true, NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password;
  `, [adminHash]);

  const bmRes = await client.query(`
    INSERT INTO users (id, email, password, name, role, "isActive", "createdAt", "updatedAt")
    VALUES ('user-bm-pasrur', 'manager.pasrur@executivemochi.pk', $1, 'Pasrur Manager', 'BRANCH_MANAGER', true, NOW(), NOW())
    ON CONFLICT (email) DO NOTHING
    RETURNING id;
  `, [bmHash]);

  if (bmRes.rows[0]) {
    await client.query(`
      INSERT INTO branch_managers (id, "userId", "branchId")
      VALUES ('bm-pasrur-link', $1, 'branch-pasrur-01')
      ON CONFLICT ("userId") DO NOTHING;
    `, [bmRes.rows[0].id]);
  }

  // 3. Prepare Product Batch Arrays
  console.log(`\nPreparing product batch data for ${productMap.size} Products...`);

  const usedArticles = new Set();
  const usedSlugs = new Set();
  const usedNames = new Set();

  const productRows = [];
  const productMetaMap = new Map();

  let count = 0;
  for (const [, prod] of productMap) {
    count++;
    const category = mapCategory(prod.category);
    const style = mapStyle(prod.category);
    const occasion = mapOccasion(prod.category);
    const leatherType = mapLeatherType(prod.brand, prod.category);
    const mfgCity = mapManufacturingCity(prod.brand);

    let articleNumber = prod.designNum;
    if (articleCounts[prod.designNum] > 1) articleNumber = `${prod.catNum}-${prod.designNum}`;
    let artBase = articleNumber; let artIdx = 2;
    while (usedArticles.has(articleNumber)) { articleNumber = `${artBase}-${artIdx}`; artIdx++; }
    usedArticles.add(articleNumber);

    const catShort = categoryShort(prod.category);
    let name = `${prod.brand} ${prod.designNum} ${catShort}`;
    let nameBase = name; let nameIdx = 2;
    while (usedNames.has(name)) { name = `${nameBase} ${nameIdx}`; nameIdx++; }
    usedNames.add(name);

    let slug = slugify(`${prod.brand}-${prod.designNum}-${catShort}`);
    let slugBase = slug; let slugIdx = 2;
    while (usedSlugs.has(slug)) { slug = `${slugBase}-${slugIdx}`; slugIdx++; }
    usedSlugs.add(slug);

    const isFeatured = prod.price >= 6000 && count % 7 === 0;
    const description = `${prod.brand} ${prod.category}. Design ${prod.designNum}.`;
    const productId = genId('p');

    const colors = Array.from(prod.colors.keys()).map(c => ({ name: mapColorName(c), hex: mapColorHex(c) }));

    productRows.push({
      id: productId, articleNumber, name, slug, description,
      basePrice: prod.price, salePrice: prod.price, category,
      occasion, style, leatherType, manufacturingCity: mfgCity, isFeatured
    });

    productMetaMap.set(slug, { articleNumber, category, colors });
  }

  // 4. Batch Insert Products and retrieve actual database IDs
  console.log('\nBulk inserting Products...');
  const slugToIdMap = new Map();
  const BATCH_SIZE = 50;
  for (let i = 0; i < productRows.length; i += BATCH_SIZE) {
    const chunk = productRows.slice(i, i + BATCH_SIZE);
    const values = [];
    const placeholders = [];
    chunk.forEach((p, idx) => {
      const offset = idx * 13;
      placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}::"ProductCategory", $${offset + 9}::"Occasion"[], $${offset + 10}::"Style", $${offset + 11}::"LeatherType", $${offset + 12}, $${offset + 13}, NOW(), NOW())`);
      values.push(p.id, p.articleNumber, p.name, p.slug, p.description, p.basePrice, p.salePrice, p.category, p.occasion, p.style, p.leatherType, p.manufacturingCity, p.isFeatured);
    });
    const sql = `
      INSERT INTO products (id, "articleNumber", name, slug, description, "basePrice", "salePrice", category, occasion, style, "leatherType", "manufacturingCity", "isFeatured", "createdAt", "updatedAt")
      VALUES ${placeholders.join(', ')}
      ON CONFLICT (slug) DO UPDATE SET "basePrice" = EXCLUDED."basePrice", "salePrice" = EXCLUDED."salePrice", "updatedAt" = NOW()
      RETURNING id, slug;
    `;
    const res = await client.query(sql, values);
    for (const r of res.rows) {
      slugToIdMap.set(r.slug, r.id);
    }
  }
  console.log(`✅ Products bulk inserted! ${slugToIdMap.size} database product IDs linked.`);

  // Fetch all existing product IDs by slug if needed
  const dbProds = await client.query('SELECT id, slug FROM products');
  dbProds.rows.forEach(r => slugToIdMap.set(r.slug, r.id));

  // 5. Prepare Variant & Inventory Rows with real product IDs
  const variantRows = [];
  const inventoryMeta = []; // { sku, variantId }

  for (const [slug, meta] of productMetaMap) {
    const realProductId = slugToIdMap.get(slug);
    if (!realProductId) continue;

    let sizes = mensSizes;
    if (meta.category === 'WOMEN') sizes = womensSizes;
    if (meta.category === 'KIDS') sizes = kidsSizes;

    for (const color of meta.colors) {
      for (const size of sizes) {
        const sku = `${meta.articleNumber}-${color.name.substring(0, 3).toUpperCase()}-${size.eu}-STD`;
        const variantId = genId('v');

        variantRows.push({
          id: variantId, productId: realProductId, sku, sizeUK: size.uk, sizeUS: size.us,
          sizeEU: size.eu, sizeCM: size.cm, color: color.name, colorHex: color.hex
        });
      }
    }
  }

  // 6. Bulk Insert Variants in Chunks of 100
  console.log(`\nBulk inserting ${variantRows.length} Product Variants...`);
  const skuToIdMap = new Map();
  const VAR_BATCH_SIZE = 100;
  for (let i = 0; i < variantRows.length; i += VAR_BATCH_SIZE) {
    const chunk = variantRows.slice(i, i + VAR_BATCH_SIZE);
    const values = [];
    const placeholders = [];
    chunk.forEach((v, idx) => {
      const offset = idx * 9;
      placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, 'STANDARD'::"Width", 0, true, NOW(), NOW())`);
      values.push(v.id, v.productId, v.sku, v.sizeUK, v.sizeUS, v.sizeEU, v.sizeCM, v.color, v.colorHex);
    });
    const sql = `
      INSERT INTO product_variants (id, "productId", sku, "sizeUK", "sizeUS", "sizeEU", "sizeCM", color, "colorHex", width, "priceDelta", "isActive", "createdAt", "updatedAt")
      VALUES ${placeholders.join(', ')}
      ON CONFLICT (sku) DO NOTHING
      RETURNING id, sku;
    `;
    const res = await client.query(sql, values);
    for (const r of res.rows) {
      skuToIdMap.set(r.sku, r.id);
    }
  }

  // Load all variant IDs from DB to map any pre-existing SKUs
  const dbVars = await client.query('SELECT id, sku FROM product_variants');
  dbVars.rows.forEach(r => skuToIdMap.set(r.sku, r.id));
  console.log(`✅ Product Variants bulk inserted! ${skuToIdMap.size} database variant IDs mapped.`);

  // 7. Bulk Insert Inventory using mapped variant IDs
  const inventoryRows = [];
  for (const [sku, realVarId] of skuToIdMap) {
    inventoryRows.push({ id: genId('i'), branchId: 'branch-pasrur-01', variantId: realVarId, quantity: Math.floor(Math.random() * 10) + 5 });
    inventoryRows.push({ id: genId('i'), branchId: 'branch-daska-01', variantId: realVarId, quantity: Math.floor(Math.random() * 8) + 3 });
  }

  console.log(`\nBulk inserting ${inventoryRows.length} Inventory Records...`);
  const INV_BATCH_SIZE = 150;
  for (let i = 0; i < inventoryRows.length; i += INV_BATCH_SIZE) {
    const chunk = inventoryRows.slice(i, i + INV_BATCH_SIZE);
    const values = [];
    const placeholders = [];
    chunk.forEach((inv, idx) => {
      const offset = idx * 4;
      placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, 0, 5, NOW())`);
      values.push(inv.id, inv.branchId, inv.variantId, inv.quantity);
    });
    const sql = `
      INSERT INTO inventory (id, "branchId", "variantId", quantity, reserved, "lowStockThreshold", "updatedAt")
      VALUES ${placeholders.join(', ')}
      ON CONFLICT ("branchId", "variantId") DO NOTHING;
    `;
    await client.query(sql, values);
  }
  console.log('✅ Inventory bulk inserted!');

  console.log('\n🎉 ALL CATALOG DATA IMPORTED SUCCESSFULLY!');
  await client.end();
}

main().catch((err) => {
  console.error('Fatal PG seed error:', err.message);
  process.exit(1);
});
