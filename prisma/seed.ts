/**
 * Executive Mochi – Database Seed
 * Seeds: 2 branches, 1 admin user, 30+ products with variants & inventory
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
      sku: `${articleNumber}-${color.name.substring(0, 3).toUpperCase()}-${size.eu}-STD`,
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
  // LADIES SANDALS
  {
    articleNumber: "EM-LC-001", name: "Ladies Eid Chappal – Classic", slug: "ladies-eid-chappal-classic",
    description: "Elegant ladies chappal from the Eid Collection. Lightweight, comfortable, perfect for festive occasions.",
    basePrice: 1800, salePrice: 1200, category: "WOMEN", style: "SANDALS", leatherType: "PREMIUM_SYNTHETIC",
    occasion: ["ETHNIC", "CASUAL"], manufacturingCity: "Pasrur", isFeatured: true,
    colors: [{ name: "Brown", hex: "#8B4513" }, { name: "Black", hex: "#1a1a1a" }, { name: "Beige", hex: "#F5F0E8" }], sizes: womensSizes
  },
  {
    articleNumber: "EM-LC-002", name: "Ladies Chappal Eid Special", slug: "ladies-chappal-eid-special",
    description: "Eid Collection ladies chappal with premium comfort sole for all-day festive wear.",
    basePrice: 2000, salePrice: 1500, category: "WOMEN", style: "SANDALS", leatherType: "PREMIUM_SYNTHETIC",
    occasion: ["ETHNIC", "WEDDING"], manufacturingCity: "Pasrur", isFeatured: false,
    colors: [{ name: "Gold", hex: "#CFB53B" }, { name: "Silver", hex: "#C0C0C0" }, { name: "Rose", hex: "#E8A0A0" }], sizes: womensSizes
  },
  {
    articleNumber: "EM-LC-003", name: "Ladies Comfort Chappal – Premium", slug: "ladies-comfort-chappal-premium",
    description: "Premium ladies chappal with superior comfort insole, durable rubber sole for casual and formal wear.",
    basePrice: 2500, salePrice: 1800, category: "WOMEN", style: "SANDALS", leatherType: "PREMIUM_SYNTHETIC",
    occasion: ["CASUAL", "FORMAL"], manufacturingCity: "Daska", isFeatured: true,
    colors: [{ name: "Black", hex: "#1a1a1a" }, { name: "Brown", hex: "#8B4513" }], sizes: womensSizes
  },
  {
    articleNumber: "EM-LC-004", name: "Imported Ladies Chappal – Liza Series", slug: "imported-ladies-chappal-liza",
    description: "Imported ladies chappal Liza series. Comfortable and stylish for festive occasions.",
    basePrice: 3400, salePrice: 2900, category: "WOMEN", style: "SANDALS", leatherType: "PREMIUM_SYNTHETIC",
    occasion: ["WEDDING", "ETHNIC"], manufacturingCity: "Imported", isFeatured: false,
    colors: [{ name: "Ivory", hex: "#FFFFF0" }, { name: "Nude", hex: "#D4A098" }, { name: "Black", hex: "#1a1a1a" }], sizes: womensSizes.slice(0, 5)
  },
  {
    articleNumber: "EM-LC-005", name: "Women's Pump Heel – Party Wear", slug: "womens-pump-heel-party",
    description: "Elegant stiletto pump for parties and formal events. Premium synthetic upper, cushioned footbed.",
    basePrice: 4500, salePrice: 3800, category: "WOMEN", style: "OXFORD", leatherType: "PREMIUM_SYNTHETIC",
    occasion: ["WEDDING", "FORMAL"], manufacturingCity: "Daska", isFeatured: true,
    colors: [{ name: "Black", hex: "#1a1a1a" }, { name: "Nude", hex: "#D4A098" }, { name: "Red", hex: "#C0392B" }], sizes: womensSizes
  },
  {
    articleNumber: "EM-LC-006", name: "Ladies Khussa – Embroidered", slug: "ladies-khussa-embroidered",
    description: "Hand-embroidered traditional khussa from Pasrur artisans. Perfect for ethnic and wedding season.",
    basePrice: 3200, salePrice: 2600, category: "WOMEN", style: "MOCCASINS", leatherType: "GOAT_LEATHER",
    occasion: ["ETHNIC", "WEDDING"], manufacturingCity: "Pasrur", isFeatured: true,
    colors: [{ name: "Multi", hex: "#8B4513" }, { name: "Gold", hex: "#CFB53B" }], sizes: womensSizes
  },

  // GENTS SANDALS
  {
    articleNumber: "EM-GC-001", name: "Gents Chappal – Memory Foam Sole", slug: "gents-chappal-memory-foam",
    description: "Summer Collection gents chappal with memory foam sole. Comfortable, waterproof and non-slippery.",
    basePrice: 4500, salePrice: 3500, category: "MEN", style: "SANDALS", leatherType: "PREMIUM_SYNTHETIC",
    occasion: ["CASUAL"], manufacturingCity: "Pasrur", isFeatured: true,
    colors: [{ name: "Black", hex: "#1a1a1a" }, { name: "Brown", hex: "#8B4513" }, { name: "Navy", hex: "#1a1a3e" }], sizes: mensSizes
  },
  {
    articleNumber: "EM-GC-002", name: "Gents Chappal – Softness Comfort", slug: "gents-chappal-softness-comfort",
    description: "Premium quality gents chappal with soft, waterproof design for everyday use.",
    basePrice: 2500, salePrice: 2000, category: "MEN", style: "SANDALS", leatherType: "PREMIUM_SYNTHETIC",
    occasion: ["CASUAL"], manufacturingCity: "Pasrur", isFeatured: false,
    colors: [{ name: "Grey", hex: "#808080" }, { name: "Black", hex: "#1a1a1a" }], sizes: mensSizes
  },
  {
    articleNumber: "EM-GC-003", name: "Gents Chappal – EVA Sole Lightweight", slug: "gents-chappal-eva-sole",
    description: "EVA sole, non-slippery, lightweight and durable. Perfect for warm weather.",
    basePrice: 3000, salePrice: 2500, category: "MEN", style: "SANDALS", leatherType: "PREMIUM_SYNTHETIC",
    occasion: ["CASUAL"], manufacturingCity: "Daska", isFeatured: false,
    colors: [{ name: "Olive", hex: "#808000" }, { name: "Black", hex: "#1a1a1a" }, { name: "Khaki", hex: "#C3B091" }], sizes: mensSizes
  },
  {
    articleNumber: "EM-GC-004", name: "Gents Classic Chappal – Goat Leather", slug: "gents-classic-chappal-leather",
    description: "Executive Mochi classic goat leather chappal for extended comfortable wear.",
    basePrice: 8000, salePrice: 7000, category: "MEN", style: "SANDALS", leatherType: "GOAT_LEATHER",
    occasion: ["CASUAL", "ETHNIC"], manufacturingCity: "Pasrur", isFeatured: true,
    colors: [{ name: "Black", hex: "#1a1a1a" }, { name: "Brown", hex: "#8B4513" }, { name: "Tan", hex: "#D2B48C" }], sizes: mensSizes
  },

  // PESHAWARI
  {
    articleNumber: "EM-GP-001", name: "Gents Peshawari – Leather Sheet Sole", slug: "gents-peshawari-leather-sheet-sole",
    description: "Eid Collection Peshawari with leather upper, leather lining, leather insole and sheet sole.",
    basePrice: 7500, salePrice: 6000, category: "MEN", style: "PESHAWARI", leatherType: "GOAT_LEATHER",
    occasion: ["ETHNIC", "WEDDING", "CASUAL"], manufacturingCity: "Pasrur", isFeatured: true,
    colors: [{ name: "Brown", hex: "#8B4513" }, { name: "Tan", hex: "#D2B48C" }, { name: "Black", hex: "#1a1a1a" }], sizes: mensSizes
  },
  {
    articleNumber: "EM-GP-002", name: "Gents Peshawari – Rubber Sole", slug: "gents-peshawari-rubber-sole",
    description: "Eid Collection Peshawari with goat leather upper and durable rubber sole.",
    basePrice: 8000, salePrice: 6000, category: "MEN", style: "PESHAWARI", leatherType: "GOAT_LEATHER",
    occasion: ["ETHNIC", "CASUAL"], manufacturingCity: "Pasrur", isFeatured: false,
    colors: [{ name: "Tan", hex: "#D2B48C" }, { name: "Brown", hex: "#8B4513" }], sizes: mensSizes
  },
  {
    articleNumber: "EM-GP-003", name: "Executive Peshawari – Calf Skin Premium", slug: "executive-peshawari-calf-skin",
    description: "Executive Mochi signature full calf-skin Peshawari. Traditional Pakistani design at its finest.",
    basePrice: 9500, salePrice: 7500, category: "MEN", style: "PESHAWARI", leatherType: "CALF_SKIN",
    occasion: ["ETHNIC", "WEDDING"], manufacturingCity: "Pasrur", isFeatured: true,
    colors: [{ name: "Brown", hex: "#8B4513" }, { name: "Tan", hex: "#D2B48C" }, { name: "Cognac", hex: "#9A463D" }], sizes: mensSizes
  },
  {
    articleNumber: "EM-GP-004", name: "Gents Formal Peshawari – Executive", slug: "gents-formal-peshawari-executive",
    description: "Premium triple-leather formal Peshawari. Sheet sole for the classic traditional look.",
    basePrice: 9500, salePrice: 7500, category: "MEN", style: "PESHAWARI", leatherType: "CALF_SKIN",
    occasion: ["ETHNIC", "FORMAL", "WEDDING"], manufacturingCity: "Pasrur", isFeatured: true,
    colors: [{ name: "Black", hex: "#1a1a1a" }, { name: "Brown", hex: "#8B4513" }, { name: "Tan", hex: "#D2B48C" }], sizes: mensSizes
  },

  // SNEAKERS
  {
    articleNumber: "EM-GS-001", name: "Gents Sports Shoes – Vietnam Import Premium", slug: "gents-sports-shoes-vietnam-premium",
    description: "Premium sports shoes imported from Vietnam with superior cushioning for active lifestyles.",
    basePrice: 13000, salePrice: 9600, category: "MEN", style: "SNEAKERS", leatherType: "PREMIUM_SYNTHETIC",
    occasion: ["SPORTS", "CASUAL"], manufacturingCity: "Imported", isFeatured: true,
    colors: [{ name: "White", hex: "#FFFFFF" }, { name: "Black", hex: "#1a1a1a" }, { name: "Navy", hex: "#1a1a3e" }], sizes: mensSizes
  },
  {
    articleNumber: "EM-GS-002", name: "Power Jogger – North Star Athletic", slug: "power-jogger-north-star",
    description: "North Star inspired athletic jogger with breathable mesh and lightweight running sole.",
    basePrice: 6500, salePrice: 5200, category: "MEN", style: "SNEAKERS", leatherType: "PREMIUM_SYNTHETIC",
    occasion: ["SPORTS", "CASUAL"], manufacturingCity: "Imported", isFeatured: false,
    colors: [{ name: "Grey", hex: "#808080" }, { name: "White", hex: "#FFFFFF" }, { name: "Red", hex: "#C0392B" }], sizes: mensSizes
  },
  {
    articleNumber: "EM-GS-003", name: "Sketchers Cheetah Series – Comfort Run", slug: "sketchers-cheetah-comfort-run",
    description: "Sketchers Cheetah series — premium quality jogger shoes for daily comfort and sports use.",
    basePrice: 6000, salePrice: 5000, category: "MEN", style: "SNEAKERS", leatherType: "PREMIUM_SYNTHETIC",
    occasion: ["SPORTS", "CASUAL"], manufacturingCity: "Imported", isFeatured: false,
    colors: [{ name: "White", hex: "#FFFFFF" }, { name: "Grey", hex: "#808080" }, { name: "Black", hex: "#1a1a1a" }], sizes: mensSizes
  },
  {
    articleNumber: "EM-GS-004", name: "Bata Comfit Sneaker – Daily Walker", slug: "bata-comfit-sneaker-daily-walker",
    description: "Everyday sneaker with superior arch support. Ideal for long walks and casual office wear.",
    basePrice: 5500, salePrice: 4500, category: "MEN", style: "SNEAKERS", leatherType: "PREMIUM_SYNTHETIC",
    occasion: ["CASUAL"], manufacturingCity: "Imported", isFeatured: false,
    colors: [{ name: "White", hex: "#FFFFFF" }, { name: "Navy", hex: "#1a1a3e" }], sizes: mensSizes
  },
  {
    articleNumber: "EM-GS-005", name: "Kids Jogger – Star Flex", slug: "kids-jogger-star-flex",
    description: "Flexible lightweight jogger for active kids. Breathable mesh upper, velcro closing.",
    basePrice: 2800, salePrice: 2200, category: "KIDS", style: "SNEAKERS", leatherType: "PREMIUM_SYNTHETIC",
    occasion: ["SPORTS", "CASUAL"], manufacturingCity: "Imported", isFeatured: false,
    colors: [{ name: "Blue", hex: "#2980B9" }, { name: "Pink", hex: "#E91E8C" }, { name: "Black", hex: "#1a1a1a" }], sizes: kidsSizes
  },

  // FORMALS
  {
    articleNumber: "EM-GF-001", name: "Gents Formal – Leather Sheet Sole Oxford", slug: "gents-formal-oxford-sheet-sole",
    description: "Leather upper with sheet sole. Classic dress shoe for office and formal events.",
    basePrice: 8000, salePrice: 6000, category: "MEN", style: "OXFORD", leatherType: "CALF_SKIN",
    occasion: ["FORMAL", "WEDDING"], manufacturingCity: "Pasrur", isFeatured: true,
    colors: [{ name: "Black", hex: "#1a1a1a" }, { name: "Brown", hex: "#8B4513" }], sizes: mensSizes
  },
  {
    articleNumber: "EM-GF-002", name: "Executive Oxford – Premium Leather Lining", slug: "executive-oxford-premium-lining",
    description: "Full leather Oxford — upper, lining, insole. Sophisticated formal for the discerning professional.",
    basePrice: 8000, salePrice: 6000, category: "MEN", style: "OXFORD", leatherType: "CALF_SKIN",
    occasion: ["FORMAL"], manufacturingCity: "Pasrur", isFeatured: false,
    colors: [{ name: "Black", hex: "#1a1a1a" }, { name: "Dark Brown", hex: "#3B1A0A" }], sizes: mensSizes
  },
  {
    articleNumber: "EM-GF-003", name: "Red Label Formal – Classic Brogue", slug: "red-label-formal-brogue",
    description: "Red Label inspired classic brogue. Decorative perforations, timeless choice for formal events.",
    basePrice: 9000, salePrice: 7500, category: "MEN", style: "OXFORD", leatherType: "CALF_SKIN",
    occasion: ["FORMAL", "WEDDING"], manufacturingCity: "Pasrur", isFeatured: false,
    colors: [{ name: "Brown", hex: "#8B4513" }, { name: "Tan", hex: "#D2B48C" }], sizes: mensSizes
  },
  {
    articleNumber: "EM-GF-004", name: "Executive Formal – Triple Leather Premium", slug: "executive-formal-triple-leather",
    description: "Premium formal shoe: leather upper, lining, insole. The finest craftsmanship from Pasrur.",
    basePrice: 10500, salePrice: 9000, category: "MEN", style: "OXFORD", leatherType: "CALF_SKIN",
    occasion: ["FORMAL", "WEDDING"], manufacturingCity: "Pasrur", isFeatured: true,
    colors: [{ name: "Black", hex: "#1a1a1a" }, { name: "Brown", hex: "#8B4513" }], sizes: mensSizes
  },
  {
    articleNumber: "EM-GF-005", name: "Gents Loafer – Suede Comfort", slug: "gents-loafer-suede-comfort",
    description: "Suede loafer for casual and semi-formal wear. Slip-on design with cushioned insole.",
    basePrice: 7000, salePrice: 5500, category: "MEN", style: "LOAFERS", leatherType: "SUEDE",
    occasion: ["CASUAL", "FORMAL"], manufacturingCity: "Daska", isFeatured: false,
    colors: [{ name: "Tan", hex: "#D2B48C" }, { name: "Navy", hex: "#1a1a3e" }, { name: "Grey", hex: "#808080" }], sizes: mensSizes
  },
  {
    articleNumber: "EM-GF-006", name: "Gents Moccasin – Nubuck Casual", slug: "gents-moccasin-nubuck-casual",
    description: "Relaxed nubuck moccasin. Hand-stitched upper, flexible rubber sole. The ultimate comfort shoe.",
    basePrice: 6800, salePrice: 5800, category: "MEN", style: "MOCCASINS", leatherType: "NUBUCK",
    occasion: ["CASUAL"], manufacturingCity: "Daska", isFeatured: false,
    colors: [{ name: "Camel", hex: "#C19A6B" }, { name: "Brown", hex: "#8B4513" }], sizes: mensSizes
  },
  {
    articleNumber: "EM-GF-007", name: "Women's Formal Pump – Office Classic", slug: "womens-formal-pump-office",
    description: "Classic office pump with moderate heel. Professional elegance for the working woman.",
    basePrice: 5200, salePrice: 4200, category: "WOMEN", style: "OXFORD", leatherType: "PREMIUM_SYNTHETIC",
    occasion: ["FORMAL", "CASUAL"], manufacturingCity: "Pasrur", isFeatured: false,
    colors: [{ name: "Black", hex: "#1a1a1a" }, { name: "Brown", hex: "#8B4513" }, { name: "Beige", hex: "#F5F0E8" }], sizes: womensSizes
  },
  {
    articleNumber: "EM-GS-006", name: "Women's Jogger – Comfit Athletic", slug: "womens-jogger-comfit-athletic",
    description: "Bata Comfit inspired women's athletic shoe. Lightweight mesh, responsive cushioning.",
    basePrice: 4800, salePrice: 3900, category: "WOMEN", style: "SNEAKERS", leatherType: "PREMIUM_SYNTHETIC",
    occasion: ["SPORTS", "CASUAL"], manufacturingCity: "Imported", isFeatured: false,
    colors: [{ name: "Pink", hex: "#E91E8C" }, { name: "White", hex: "#FFFFFF" }, { name: "Teal", hex: "#14A085" }], sizes: womensSizes
  },
  {
    articleNumber: "EM-KI-001", name: "Kids School Shoe – Ambassador Series", slug: "kids-school-shoe-ambassador",
    description: "Ambassador series school shoe. Durable, comfortable, slip-resistant. Built to last the school year.",
    basePrice: 3500, salePrice: 2800, category: "KIDS", style: "OXFORD", leatherType: "PREMIUM_SYNTHETIC",
    occasion: ["FORMAL"], manufacturingCity: "Imported", isFeatured: false,
    colors: [{ name: "Black", hex: "#1a1a1a" }, { name: "Brown", hex: "#8B4513" }], sizes: kidsSizes
  },
];

async function main() {
  console.log("🌱 Seeding Executive Mochi database...\n");

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
  console.log(`  ✅ ${pasrur.name}`);
  console.log(`  ✅ ${daska.name}`);

  console.log("\nCreating users...");
  const adminHash = await bcrypt.hash("Admin@12345", 12);
  const admin = await db.user.upsert({
    where: { email: "admin@executivemochi.pk" },
    create: { email: "admin@executivemochi.pk", password: adminHash, name: "Admin", role: "ADMIN", isActive: true },
    update: { password: adminHash },
  });
  console.log(`  ✅ Admin: ${admin.email} / Admin@12345`);

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
  console.log(`  ✅ Branch Manager: ${bmUser.email} / Manager@12345`);

  console.log("\nCreating products...");
  for (const def of productDefs) {
    const { colors, sizes, ...productData } = def;
    const variantData = makeVariantData(productData.articleNumber, colors, sizes);
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
    console.log(`  ✅ ${product.name} (${variants.length} variants)`);
  }

  console.log("\n🎉 Seed complete!\n");
  console.log("  Admin:          admin@executivemochi.pk / Admin@12345");
  console.log("  Branch Manager: manager.pasrur@executivemochi.pk / Manager@12345");
}

main().catch(console.error).finally(() => db.$disconnect());
