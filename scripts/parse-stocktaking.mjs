/**
 * Generate seed data from stocktaking_categorized.md
 * Outputs the full seed.ts file with all products from the stocktaking document.
 */
import { readFileSync, writeFileSync } from 'fs';

const content = readFileSync('stocktaking_categorized.md', 'utf-8');
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
  if (brandMatch) {
    currentBrand = brandMatch[1].trim();
    continue;
  }
  
  const catMatch = trimmed.match(/^### (\d+) · (.+?) — (.+?)(?:\s*\(cont\.\))?$/);
  if (catMatch) {
    currentCatNum = catMatch[1];
    currentCatName = catMatch[3].trim();
    inTable = false;
    headerSeen = false;
    continue;
  }
  
  if (trimmed.startsWith('| Design #')) { inTable = true; headerSeen = false; continue; }
  if (trimmed.startsWith('| ---')) { headerSeen = true; continue; }
  
  if (inTable && headerSeen && trimmed.startsWith('|') && trimmed.endsWith('|')) {
    const cells = trimmed.split('|').map(c => c.trim()).filter(c => c);
    if (cells.length >= 3) {
      rawProducts.push({
        brand: currentBrand,
        catNum: currentCatNum,
        category: currentCatName,
        designNum: cells[0],
        color: cells[1],
        price: parseInt(cells[2], 10) || 0
      });
    }
  } else if (trimmed === '' || trimmed.startsWith('*Table')) {
    // keep going
  } else {
    inTable = false;
    headerSeen = false;
  }
}

// Map category names to Prisma enums
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
  if (lower.includes('sandal')) return 'SANDALS';
  if (lower.includes('chappal')) return 'SANDALS';
  if (lower.includes('shoe') || lower.includes('oxford') || lower.includes('formal')) return 'OXFORD';
  if (lower.includes('loafer')) return 'LOAFERS';
  if (lower.includes('pvc') || lower.includes('eva')) return 'SANDALS';
  if (lower.includes('hawai')) return 'SANDALS';
  if (lower.includes('canvas')) return 'SNEAKERS';
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
  if (brand === 'Others' && (lower.includes('shoe') || lower.includes('moccasin'))) return 'GOAT_LEATHER';
  return 'PREMIUM_SYNTHETIC';
}

function mapManufacturingCity(brand) {
  if (['Imported', 'Bata', 'Hush Puppies'].includes(brand)) return 'Imported';
  if (brand === 'Executive') return 'Pasrur';
  return 'Imported';
}

function mapColorHex(colorCode) {
  const map = {
    'BLK': '#1a1a1a', 'BLACK': '#1a1a1a',
    'BRN': '#8B4513', 'BROWN': '#8B4513', 'L.BRN': '#A0522D',
    'WHT': '#FFFFFF', 'WHITE': '#FFFFFF', 'OFF.WHT': '#FAF0E6',
    'BIG': '#D2B48C', 'BEIGE - CREAM': '#F5F0E8',
    'BLUE': '#2980B9', 'NAVY': '#1a1a3e',
    'RED.MRN': '#800020', 'RED': '#C0392B',
    'GRY': '#808080', 'GREY': '#808080',
    'GRN': '#2E8B57', 'OLIVE': '#808000',
    'PNK': '#E91E8C', 'PRL': '#E8C8B0',
    'TAN': '#D2B48C', 'CML': '#C19A6B',
    'MST': '#DAA520', 'YEL': '#FFD700',
    'ESP': '#3C1414', 'KHAKI': '#C3B091',
    'SKY': '#87CEEB', 'WINDY': '#A0AEC0', 'CHIKO': '#CD853F',
    'OFF WHITE': '#FAF0E6', 'UNI BLK': '#1a1a1a',
    'OPEN': '#808080'
  };
  return map[colorCode] || '#808080';
}

function mapColorName(colorCode) {
  const map = {
    'BLK': 'Black', 'BLACK': 'Black',
    'BRN': 'Brown', 'BROWN': 'Brown', 'L.BRN': 'Light Brown',
    'WHT': 'White', 'WHITE': 'White', 'OFF.WHT': 'Off White',
    'BIG': 'Beige', 'BEIGE - CREAM': 'Beige Cream',
    'BLUE': 'Blue', 'NAVY': 'Navy',
    'RED.MRN': 'Maroon', 'RED': 'Red',
    'GRY': 'Grey', 'GREY': 'Grey',
    'GRN': 'Green', 'OLIVE': 'Olive',
    'PNK': 'Pink', 'PRL': 'Pearl',
    'TAN': 'Tan', 'CML': 'Camel',
    'MST': 'Mustard', 'YEL': 'Yellow',
    'ESP': 'Espresso', 'KHAKI': 'Khaki',
    'SKY': 'Sky Blue', 'WINDY': 'Windy',
    'CHIKO': 'Chiko', 'OFF WHITE': 'Off White',
    'UNI BLK': 'Uni Black', 'OPEN': 'Open'
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

// Readable category short names for product names
function categoryShort(catName) {
  const map = {
    'Gents Sports Shoes': 'Sports',
    'Gents Moccasins': 'Moccasin',
    'Gents Moccasins 2': 'Moccasin',
    'Gents Peshawari': 'Peshawari',
    'Gents Sandals': 'Sandal',
    'Gents Chappals': 'Chappal',
    'Gents PVC & EVA': 'PVC Slide',
    'Gents Hawai': 'Hawai',
    'Ladies Sports Shoes': 'Ladies Sports',
    'Ladies Sports': 'Ladies Sports',
    'Ladies Shoes': 'Ladies Shoe',
    'Ladies Sandals': 'Ladies Sandal',
    'Ladies Chappals': 'Ladies Chappal',
    'Ladies Canvas': 'Ladies Canvas',
    'Ladies PVC': 'Ladies PVC',
    'Ladies PVC & EVA': 'Ladies PVC',
    'Ladies Moccasins': 'Ladies Moccasin',
    'Youth Sports Shoes': 'Youth Sports',
    'Youth Shoes': 'Youth Shoe',
    'Youth Sandals': 'Youth Sandal',
    'Youth Chappals': 'Youth Chappal',
    'Boys/Girls Sports Shoes': 'Kids Sports',
    'Boys/Girls Moccasins': 'Kids Moccasin',
    'Boys/Girls Sandals': 'Kids Sandal',
    'Boys/Girls Chappals': 'Kids Chappal',
    'Girls Chappals': 'Girls Chappal',
    'Girls Sandals': 'Girls Sandal',
    'Girls Canvas': 'Girls Canvas',
    'Child Sports Shoes': 'Child Sports',
    'Child Moccasins': 'Child Moccasin',
    'Child Sandals': 'Child Sandal',
    'Child Chappals': 'Child Chappal',
    'Kids Sports Shoes': 'Kids Sports',
    'Kids Shoes': 'Kids Shoe',
    'Kids Sandals': 'Kids Sandal',
    'Kids Chappals': 'Kids Chappal',
  };
  return map[catName] || catName;
}

// Group by unique design number + brand + category
const productMap = new Map();

for (const row of rawProducts) {
  const key = `${row.brand}|${row.catNum}|${row.designNum}`;
  
  if (!productMap.has(key)) {
    productMap.set(key, {
      brand: row.brand,
      catNum: row.catNum,
      category: row.category,
      designNum: row.designNum,
      price: row.price,
      colors: new Map()
    });
  }
  
  const prod = productMap.get(key);
  if (row.price > prod.price) prod.price = row.price;
  if (!prod.colors.has(row.color)) {
    prod.colors.set(row.color, row.price);
  }
}

// Disambiguate article numbers – prefix with catNum for duplicates
const articleCounts = {};
for (const [, prod] of productMap) {
  articleCounts[prod.designNum] = (articleCounts[prod.designNum] || 0) + 1;
}

// Generate seed definitions
const seedProducts = [];
const usedArticles = new Set();
const usedSlugs = new Set();
const usedNames = new Set();
let counter = 0;

for (const [, prod] of productMap) {
  counter++;
  const category = mapCategory(prod.category);
  const style = mapStyle(prod.category);
  const occasion = mapOccasion(prod.category);
  const leatherType = mapLeatherType(prod.brand, prod.category);
  const mfgCity = mapManufacturingCity(prod.brand);
  
  const colorList = Array.from(prod.colors.keys()).map(c => ({
    name: mapColorName(c),
    hex: mapColorHex(c)
  }));
  
  let sizeType = 'mensSizes';
  if (category === 'WOMEN') sizeType = 'womensSizes';
  if (category === 'KIDS') sizeType = 'kidsSizes';
  
  // Disambiguate article number
  let articleNumber = prod.designNum;
  if (articleCounts[prod.designNum] > 1) {
    articleNumber = `${prod.catNum}-${prod.designNum}`;
  }
  // Ensure uniqueness
  let artBase = articleNumber;
  let artIdx = 2;
  while (usedArticles.has(articleNumber)) {
    articleNumber = `${artBase}-${artIdx}`;
    artIdx++;
  }
  usedArticles.add(articleNumber);
  
  const catShort = categoryShort(prod.category);
  let name = `${prod.brand} ${prod.designNum} ${catShort}`;
  let nameBase = name;
  let nameIdx = 2;
  while (usedNames.has(name)) {
    name = `${nameBase} ${nameIdx}`;
    nameIdx++;
  }
  usedNames.add(name);
  
  let slug = slugify(`${prod.brand}-${prod.designNum}-${catShort}`);
  let slugBase = slug;
  let slugIdx = 2;
  while (usedSlugs.has(slug)) {
    slug = `${slugBase}-${slugIdx}`;
    slugIdx++;
  }
  usedSlugs.add(slug);
  
  const isFeatured = prod.price >= 6000 && counter % 7 === 0;
  
  const description = `${prod.brand} ${prod.category}. Design ${prod.designNum}. Available in ${colorList.map(c => c.name).join(', ')}.`;
  
  seedProducts.push({
    articleNumber,
    name,
    slug,
    description,
    basePrice: prod.price,
    salePrice: prod.price,
    category,
    style,
    leatherType,
    occasion,
    manufacturingCity: mfgCity,
    isFeatured,
    colors: colorList,
    sizeType
  });
}

console.log(`Total seed products generated: ${seedProducts.length}`);

// Verify no duplicates
const artCheck = new Set(seedProducts.map(p => p.articleNumber));
const slugCheck = new Set(seedProducts.map(p => p.slug));
const nameCheck = new Set(seedProducts.map(p => p.name));
console.log(`Unique articleNumbers: ${artCheck.size}`);
console.log(`Unique slugs: ${slugCheck.size}`);
console.log(`Unique names: ${nameCheck.size}`);

if (artCheck.size !== seedProducts.length) console.log('WARNING: Duplicate article numbers!');
if (slugCheck.size !== seedProducts.length) console.log('WARNING: Duplicate slugs!');
if (nameCheck.size !== seedProducts.length) console.log('WARNING: Duplicate names!');

// Generate productDefs array content
let tsCode = '';
for (const p of seedProducts) {
  const colorsStr = p.colors.map(c => `{ name: "${c.name}", hex: "${c.hex}" }`).join(', ');
  const occasionStr = p.occasion.map(o => `"${o}"`).join(', ');
  
  // Escape any quotes in strings
  const safeName = p.name.replace(/"/g, '\\"');
  const safeDesc = p.description.replace(/"/g, '\\"');
  
  tsCode += `  {\n`;
  tsCode += `    articleNumber: "${p.articleNumber}", name: "${safeName}",\n`;
  tsCode += `    slug: "${p.slug}",\n`;
  tsCode += `    description: "${safeDesc}",\n`;
  tsCode += `    basePrice: ${p.basePrice}, salePrice: ${p.salePrice},\n`;
  tsCode += `    category: "${p.category}", style: "${p.style}", leatherType: "${p.leatherType}",\n`;
  tsCode += `    occasion: [${occasionStr}], manufacturingCity: "${p.manufacturingCity}",\n`;
  tsCode += `    isFeatured: ${p.isFeatured},\n`;
  tsCode += `    colors: [${colorsStr}],\n`;
  tsCode += `    sizes: ${p.sizeType}\n`;
  tsCode += `  },\n`;
}

// Write the full seed.ts
const fullSeed = `/**
 * Executive Mochi – Database Seed
 * Auto-generated from stocktaking_categorized.md
 * Seeds: 2 branches, 1 admin user, ${seedProducts.length} products with variants & inventory
 *
 * Run: npm run db:seed
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Use direct URL (non-pooler) for seed to avoid Neon connection timeouts
const db = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL } },
});

const mensSizes = [
  { uk: "6", us: "7", eu: "39", cm: "24.5" },
  { uk: "7", us: "8", eu: "40", cm: "25.5" },
  { uk: "8", us: "9", eu: "42", cm: "26.5" },
  { uk: "9", us: "10", eu: "43", cm: "27.5" },
  { uk: "10", us: "11", eu: "44", cm: "28.5" },
  { uk: "11", us: "12", eu: "45", cm: "29.5" },
];

const womensSizes = [
  { uk: "3", us: "5.5", eu: "36", cm: "22.5" },
  { uk: "4", us: "6.5", eu: "37", cm: "23.5" },
  { uk: "5", us: "7.5", eu: "38", cm: "24.0" },
  { uk: "6", us: "8.5", eu: "39", cm: "24.5" },
  { uk: "7", us: "9.5", eu: "40", cm: "25.5" },
  { uk: "8", us: "10.5", eu: "41", cm: "26.0" },
];

const kidsSizes = [
  { uk: "10K", us: "11K", eu: "28", cm: "17.0" },
  { uk: "11K", us: "12K", eu: "29", cm: "17.5" },
  { uk: "12K", us: "13K", eu: "30", cm: "18.5" },
  { uk: "1", us: "2", eu: "33", cm: "20.5" },
  { uk: "2", us: "3", eu: "35", cm: "21.5" },
  { uk: "3", us: "4", eu: "36", cm: "22.5" },
];

function makeVariantData(
  articleNumber: string,
  colors: { name: string; hex: string }[],
  sizes: { uk: string; us: string; eu: string; cm: string }[]
) {
  return colors.flatMap((color) =>
    sizes.map((size) => ({
      sku: \`\${articleNumber}-\${color.name.substring(0, 3).toUpperCase()}-\${size.eu}-STD\`,
      sizeUK: size.uk,
      sizeUS: size.us,
      sizeEU: size.eu,
      sizeCM: size.cm,
      color: color.name,
      colorHex: color.hex,
      width: "STANDARD" as const,
      priceDelta: 0,
      isActive: true,
    }))
  );
}

const productDefs: any[] = [
${tsCode}];

async function main() {
  console.log("🌱 Seeding Executive Mochi database...\\n");

  console.log("Creating branches...");
  const pasrur = await db.branch.upsert({
    where: { id: "branch-pasrur-01" },
    create: {
      id: "branch-pasrur-01", name: "Executive Mochi – Pasrur", city: "Pasrur",
      address: "Timber Market, Pasrur, Sialkot", landmark: "Near Service Super Shoes, Timber Market",
      phone: "+92-345-8760001", managerName: "Branch Manager Pasrur",
      operatingHours: "10:00 AM – 9:00 PM", isActive: true
    },
    update: {},
  });
  const daska = await db.branch.upsert({
    where: { id: "branch-daska-01" },
    create: {
      id: "branch-daska-01", name: "Executive Mochi – Daska", city: "Daska",
      address: "Kachehri Road, Daska, Sialkot", landmark: "Near Service Super Shoes, Kachehri Road",
      phone: "+92-345-8760002", managerName: "Branch Manager Daska",
      operatingHours: "10:00 AM – 9:00 PM", isActive: true
    },
    update: {},
  });
  console.log(\`  ✅ \${pasrur.name}\`);
  console.log(\`  ✅ \${daska.name}\`);

  console.log("\\nCreating users...");
  const adminHash = await bcrypt.hash("Admin@12345", 12);
  const admin = await db.user.upsert({
    where: { email: "admin@executivemochi.pk" },
    create: { email: "admin@executivemochi.pk", password: adminHash, name: "Admin", role: "ADMIN", isActive: true },
    update: { password: adminHash },
  });
  console.log(\`  ✅ Admin: \${admin.email} / Admin@12345\`);

  const bmHash = await bcrypt.hash("Manager@12345", 12);
  const bmUser = await db.user.upsert({
    where: { email: "manager.pasrur@executivemochi.pk" },
    create: { email: "manager.pasrur@executivemochi.pk", password: bmHash, name: "Pasrur Manager", role: "BRANCH_MANAGER", isActive: true },
    update: {},
  });
  await db.branchManager.upsert({
    where: { userId: bmUser.id },
    create: { userId: bmUser.id, branchId: pasrur.id },
    update: {},
  });
  console.log(\`  ✅ Branch Manager: \${bmUser.email} / Manager@12345\`);

  console.log(\`\\nCreating \${productDefs.length} products...\`);
  let created = 0;
  let skipped = 0;
  
  for (const def of productDefs) {
    const { colors, sizes, ...productData } = def;
    const variantData = makeVariantData(productData.articleNumber, colors, sizes);
    
    try {
      const product = await db.product.upsert({
        where: { slug: productData.slug },
        create: { ...productData, isActive: true, variants: { create: variantData } },
        update: { basePrice: productData.basePrice, salePrice: productData.salePrice },
      });
      
      const variants = await db.productVariant.findMany({ where: { productId: product.id } });
      for (const v of variants) {
        await db.inventory.upsert({
          where: { branchId_variantId: { branchId: pasrur.id, variantId: v.id } },
          create: { branchId: pasrur.id, variantId: v.id, quantity: Math.floor(Math.random() * 10) + 5 },
          update: {},
        });
        await db.inventory.upsert({
          where: { branchId_variantId: { branchId: daska.id, variantId: v.id } },
          create: { branchId: daska.id, variantId: v.id, quantity: Math.floor(Math.random() * 8) + 3 },
          update: {},
        });
      }
      
      created++;
      if (created % 50 === 0) {
        console.log(\`  ... \${created}/\${productDefs.length} products created\`);
      }
    } catch (err: any) {
      skipped++;
      if (skipped <= 20) {
        console.log(\`  ⚠️ Skipped \${productData.articleNumber}: \${err.message?.substring(0, 120)}\`);
      }
    }
  }

  console.log(\`\\n🎉 Seed complete! Created \${created} products, skipped \${skipped}\\n\`);
  console.log("  Admin:          admin@executivemochi.pk / Admin@12345");
  console.log("  Branch Manager: manager.pasrur@executivemochi.pk / Manager@12345");
}

main().catch(console.error).finally(() => db.$disconnect());
`;

writeFileSync('prisma/seed.ts', fullSeed);
console.log(`\nWritten full seed.ts with ${seedProducts.length} products`);
