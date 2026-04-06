import fs from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getCategory(categoryStr: string) {
  if (categoryStr.toLowerCase().includes('gent') || categoryStr.toLowerCase().includes('men')) return "MEN";
  if (categoryStr.toLowerCase().includes('lad') || categoryStr.toLowerCase().includes('women')) return "WOMEN";
  return "KIDS";
}

function getStyle(categoryStr: string) {
  const c = categoryStr.toLowerCase();
  if (c.includes('sport') || c.includes('canvas')) return "SNEAKERS";
  if (c.includes('moccasin')) return "MOCCASINS";
  if (c.includes('peshawari')) return "PESHAWARI";
  if (c.includes('sandal') || c.includes('chappal') || c.includes('hawai') || c.includes('pvc')) return "SANDALS";
  return "LOAFERS";
}

async function main() {
  const content = fs.readFileSync('stocktaking_categorized.md', 'utf-8');
  const lines = content.split('\n');

  let currentBrand = '';
  let currentCategory = '';

  for (const line of lines) {
    const brandMatch = line.match(/^##\s+(.+)$/);
    if (brandMatch) {
      currentBrand = brandMatch[1].trim();
      continue;
    }

    const catMatch = line.match(/^###\s+[\d]+\s*·\s*(.+?)\s*—\s*(.+)$/);
    if (catMatch) {
      currentBrand = catMatch[1].trim(); // Override brand if needed
      currentCategory = catMatch[2].trim().replace(/\(cont\.\)/i, '').trim();
      continue;
    }

    // Match table rows: | CHDI0005-0 | BLACK | 4200 |
    const rowMatch = line.match(/^\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|$/);
    if (rowMatch && !line.includes('Design #')) {
      const designNo = rowMatch[1].trim();
      const color = rowMatch[2].trim();
      const priceStr = rowMatch[3].trim();
      const price = parseFloat(priceStr);

      if (!designNo || isNaN(price)) continue;

      const slug = `${currentBrand}-${currentCategory}-${designNo}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const articleNumber = `${currentBrand.substring(0,3).toUpperCase()}-${designNo}`;
      const productName = `${currentBrand} ${currentCategory} - ${designNo}`;

      let product = await prisma.product.findUnique({ where: { articleNumber } });

      if (!product) {
        let uniqueSlug = slug;
        let counter = 1;
        while (await prisma.product.findUnique({ where: { slug: uniqueSlug } })) {
          uniqueSlug = `${slug}-${counter}`;
          counter++;
        }

        product = await prisma.product.create({
          data: {
            articleNumber,
            name: productName,
            slug: uniqueSlug,
            description: `${currentBrand} ${currentCategory} - Design ${designNo}`,
            basePrice: price,
            category: getCategory(currentCategory),
            occasion: ["CASUAL"],
            style: getStyle(currentCategory),
            leatherType: "PREMIUM_SYNTHETIC",
            manufacturingCity: "Imported"
          }
        });
        console.log(`Created product: ${product.name}`);
      }

      // Create variant
      const sku = `${articleNumber}-${color}-STD`.replace(/\s+/g, '');
      const existingVariant = await prisma.productVariant.findUnique({ where: { sku } });

      if (!existingVariant) {
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            sku,
            sizeUK: '8', // Default dummy sizes
            sizeUS: '9',
            sizeEU: '42',
            sizeCM: '27',
            color: color,
            colorHex: '#000000', // Default
            width: "STANDARD",
            priceDelta: 0
          }
        });
        console.log(`Created variant: ${sku} for ${productName}`);
      }
    }
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
