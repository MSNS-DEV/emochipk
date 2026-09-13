import { google, content_v2_1 } from "googleapis";
import { db as prisma } from "@/server/db";
import pg from "pg";
import type { Product, ProductVariant, ProductImage, Inventory } from "@prisma/client";

export interface GMCConfig {
  merchantId: string;
  dataSourceId: string;
  clientEmail: string;
  privateKey: string;
  targetCountry: string;
  contentLanguage: string;
  currency: string;
  appUrl: string;
}

export interface GMCSyncResult {
  success: boolean;
  mode: "api" | "dry-run";
  totalProducts: number;
  totalVariants: number;
  syncedVariants: number;
  errors: Array<{ sku: string; error: string }>;
  batchResults?: any[];
  timestamp: string;
}

export interface GMCProductItem {
  id: string; // online:en:PK:EM001-BLK-42-STD
  offerId: string; // EM001-BLK-42-STD
  title: string;
  description: string;
  link: string;
  imageLink: string;
  additionalImageLinks?: string[];
  contentLanguage: string;
  targetCountry: string;
  feedLabel: string;
  channel: string;
  availability: "in_stock" | "out_of_stock" | "preorder";
  price: {
    value: string;
    currency: string;
  };
  salePrice?: {
    value: string;
    currency: string;
  };
  brand: string;
  condition: string;
  googleProductCategory?: string;
  gender?: "male" | "female" | "unisex";
  ageGroup?: "adult" | "kids" | "toddler" | "infant";
  color?: string;
  sizes?: string[];
  sizeSystem?: string;
  sizeType?: string;
  itemGroupId?: string;
  mpn?: string;
  identifierExists: boolean;
}

/**
 * Resolves current GMC Configuration from environment variables
 */
export function getGMCConfig(): GMCConfig {
  const merchantId = process.env.GMC_MERCHANT_ID || process.env.GOOGLE_MERCHANT_ID || "5778703057";
  const dataSourceId = process.env.GMC_DATA_SOURCE_ID || process.env.GMC_FEED_ID || "10714797520";
  const clientEmail = process.env.GMC_CLIENT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL || "";
  let privateKey = process.env.GMC_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY || "";
  
  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  const targetCountry = process.env.GMC_TARGET_COUNTRY || "PK";
  const contentLanguage = process.env.GMC_CONTENT_LANGUAGE || "en";
  const currency = process.env.GMC_CURRENCY || "PKR";
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://executivemochi.pk").replace(/\/$/, "");

  return {
    merchantId,
    dataSourceId,
    clientEmail,
    privateKey,
    targetCountry,
    contentLanguage,
    currency,
    appUrl,
  };
}

/**
 * Checks if GMC API credentials are fully configured
 */
export function isGMCConfigured(config: GMCConfig = getGMCConfig()): boolean {
  return Boolean(config.merchantId && config.clientEmail && config.privateKey);
}

/**
 * Creates authenticated Google Content API v2.1 client instance
 */
export function getGMCClient(config: GMCConfig = getGMCConfig()): content_v2_1.Content | null {
  if (!isGMCConfigured(config)) {
    return null;
  }

  const auth = new google.auth.JWT({
    email: config.clientEmail,
    key: config.privateKey,
    scopes: ["https://www.googleapis.com/auth/content"],
  });

  return google.content({
    version: "v2.1",
    auth,
  });
}

/**
 * Maps database product category/style to Google Product Taxonomy string
 */
export function mapGoogleCategory(category: string, style: string): string {
  if (category === "ACCESSORIES" || style === "ACCESSORIES") {
    return "Apparel & Accessories > Clothing Accessories > Shoe Accessories";
  }
  switch (style) {
    case "LOAFERS":
    case "LOAFERS_MOZA":
    case "MOCCASINS":
    case "FORMAL_MOCCASINS":
    case "CASUAL_SHOES":
      return "Apparel & Accessories > Shoes > Loafers & Slip-Ons";
    case "SANDALS":
    case "CHAPPAL":
    case "PESHAWARI":
    case "PESHAWARI_KHUSSA":
      return "Apparel & Accessories > Shoes > Sandals";
    case "SNEAKERS":
    case "SPORTS":
    case "SKECHERS":
      return "Apparel & Accessories > Shoes > Athletic Shoes";
    case "COURT_SHOES":
    case "BUMPS":
      return "Apparel & Accessories > Shoes > High Heels";
    case "OXFORD":
    case "SCHOOL":
    default:
      return "Apparel & Accessories > Shoes";
  }
}

/**
 * Maps database product category to Google gender attribute
 */
export function mapGender(category: string): "male" | "female" | "unisex" {
  if (category === "WOMEN") return "female";
  if (category === "MEN") return "male";
  return "unisex";
}

/**
 * Maps database product category to Google ageGroup attribute
 */
export function mapAgeGroup(category: string): "adult" | "kids" {
  if (category === "KIDS") return "kids";
  return "adult";
}

/**
 * Robust DB query with fallback to native pg driver if Prisma native binary engine fails
 */
export async function fetchProductsForGMC(): Promise<any[]> {
  try {
    return await prisma.product.findMany({
      where: { isActive: true },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: {
          where: { isActive: true },
          include: { inventory: true },
        },
      },
    });
  } catch (err: any) {
    if (
      err?.message?.includes("libquery_engine") ||
      err?.message?.includes("EM_X86_64") ||
      err?.message?.includes("PrismaClientInitializationError")
    ) {
      return await fetchProductsViaPg();
    }
    throw err;
  }
}

async function fetchProductsViaPg(): Promise<any[]> {
  const dbUrl =
    process.env.DIRECT_URL ||
    process.env.DATABASE_URL ||
    "postgresql://neondb_owner:npg_si9fM8gyAZCx@ep-young-scene-a1czywn2-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

  const pool = new pg.Pool({ connectionString: dbUrl });
  try {
    const productsRes = await pool.query(
      `SELECT * FROM products WHERE "isActive" = true ORDER BY "createdAt" DESC`
    );
    const variantsRes = await pool.query(
      `SELECT * FROM product_variants WHERE "isActive" = true`
    );
    const imagesRes = await pool.query(
      `SELECT * FROM product_images ORDER BY "sortOrder" ASC`
    );
    const inventoryRes = await pool.query(`SELECT * FROM inventory`);

    const variantsMap = new Map<string, any[]>();
    variantsRes.rows.forEach((v) => {
      const inv = inventoryRes.rows.filter((i) => i.variantId === v.id);
      const variantWithInv = {
        ...v,
        priceDelta: Number(v.priceDelta || 0),
        inventory: inv,
      };
      if (!variantsMap.has(v.productId)) variantsMap.set(v.productId, []);
      variantsMap.get(v.productId)!.push(variantWithInv);
    });

    const imagesMap = new Map<string, any[]>();
    imagesRes.rows.forEach((img) => {
      if (!imagesMap.has(img.productId)) imagesMap.set(img.productId, []);
      imagesMap.get(img.productId)!.push(img);
    });

    return productsRes.rows.map((p) => ({
      ...p,
      basePrice: Number(p.basePrice),
      salePrice: p.salePrice ? Number(p.salePrice) : null,
      variants: variantsMap.get(p.id) || [],
      images: imagesMap.get(p.id) || [],
    }));
  } finally {
    await pool.end();
  }
}

/**
 * Formats a single product variant into Google Content API Product schema
 */
export function buildGMCProductItem(
  product: Product & { images: ProductImage[] },
  variant: ProductVariant & { inventory?: Inventory[] },
  config: GMCConfig = getGMCConfig()
): GMCProductItem {
  const channel = "online";
  const { contentLanguage, targetCountry, currency, appUrl } = config;
  
  const HIGH_RES_FALLBACK = "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1000&auto=format&fit=crop";

  const normalizeUrl = (rawUrl?: string): string => {
    if (!rawUrl || rawUrl.includes("placeholder.jpg")) return HIGH_RES_FALLBACK;
    if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) return rawUrl;
    return `${appUrl}/${rawUrl.replace(/^\//, "")}`;
  };

  // Primary image selection: Match variant color tag first, then primary flag, then fallback to first image
  const colorMatchImage = product.images.find(
    (img) => img.colorTag && img.colorTag.toLowerCase() === (variant.color || "").toLowerCase()
  );
  const primaryImage = colorMatchImage || product.images.find((img) => img.isPrimary) || product.images[0];

  const imageLink = normalizeUrl(primaryImage?.url);
  const additionalImageLinks = product.images
    .filter((img) => img.id !== primaryImage?.id)
    .map((img) => normalizeUrl(img.url));

  // Link to storefront
  const link = `${appUrl}/product/${product.slug}?variant=${encodeURIComponent(variant.sku)}`;

  // Price calculations
  const basePriceNum = Number(product.basePrice);
  const deltaNum = Number(variant.priceDelta || 0);
  const finalBasePrice = basePriceNum + deltaNum;

  let salePriceObj: { value: string; currency: string } | undefined = undefined;
  if (product.salePrice && Number(product.salePrice) > 0 && Number(product.salePrice) < basePriceNum) {
    const saleNum = Number(product.salePrice) + deltaNum;
    salePriceObj = {
      value: saleNum.toFixed(2),
      currency,
    };
  }

  // Total inventory stock (Google requires "in_stock" or "out_of_stock")
  const totalStock = (variant.inventory || []).reduce((acc, inv) => acc + inv.quantity, 0);
  const availability = totalStock > 0 ? "in_stock" : "out_of_stock";

  // Article title with variant specs
  const title = `${product.name} - ${variant.color} (UK ${variant.sizeUK})`;

  const offerId = variant.sku;
  const id = `${channel}:${contentLanguage}:${targetCountry}:${offerId}`;

  const cleanDescription = (product.description || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 5000) || `${product.name} handcrafted leather footwear by Executive Mochi.`;

  return {
    id,
    offerId,
    title,
    description: cleanDescription,
    link,
    imageLink,
    additionalImageLinks: additionalImageLinks.length > 0 ? additionalImageLinks : undefined,
    contentLanguage,
    targetCountry,
    feedLabel: targetCountry,
    channel,
    availability,
    price: {
      value: finalBasePrice.toFixed(2),
      currency,
    },
    salePrice: salePriceObj,
    brand: "Executive Mochi",
    condition: "new",
    googleProductCategory: mapGoogleCategory(product.category, product.style),
    gender: mapGender(product.category),
    ageGroup: mapAgeGroup(product.category),
    color: variant.color || "Black",
    sizes: [variant.sizeUK || "M"],
    sizeSystem: "UK",
    sizeType: "regular",
    itemGroupId: product.articleNumber || product.id,
    mpn: variant.sku,
    identifierExists: false,
  };
}

/**
 * Pushes all active products & variants to Google Merchant Center API (or Dry Run mode)
 */
export async function syncAllProductsToGMC(
  config: GMCConfig = getGMCConfig()
): Promise<GMCSyncResult> {
  const isConfigured = isGMCConfigured(config);
  const client = getGMCClient(config);

  const products = await fetchProductsForGMC();

  const errors: Array<{ sku: string; error: string }> = [];
  const gmcItems: GMCProductItem[] = [];

  for (const product of products) {
    for (const variant of product.variants) {
      try {
        const item = buildGMCProductItem(product, variant, config);
        gmcItems.push(item);
      } catch (err: any) {
        errors.push({
          sku: variant.sku,
          error: err.message || "Failed to build GMC payload",
        });
      }
    }
  }

  const totalProducts = products.length;
  const totalVariants = gmcItems.length + errors.length;

  if (!isConfigured || !client) {
    // DRY RUN MODE: Return validated payload summary
    return {
      success: true,
      mode: "dry-run",
      totalProducts,
      totalVariants,
      syncedVariants: gmcItems.length,
      errors,
      batchResults: gmcItems.map((item) => ({
        offerId: item.offerId,
        title: item.title,
        price: `${item.price.value} ${item.price.currency}`,
        availability: item.availability,
        status: "validated_dry_run",
      })),
      timestamp: new Date().toISOString(),
    };
  }

  // API MODE: Execute Google Content API customBatch insert/update
  try {
    const batchEntries = gmcItems.map((item, index) => ({
      batchId: index + 1,
      merchantId: config.merchantId,
      method: "insert",
      productId: item.id,
      product: item as any,
    }));

    const chunkSize = 1000;
    const batchResponses = [];

    for (let i = 0; i < batchEntries.length; i += chunkSize) {
      const chunk = batchEntries.slice(i, i + chunkSize);
      const res = await client.products.custombatch({
        requestBody: {
          entries: chunk,
        },
      });
      batchResponses.push(res.data);
    }

    let successCount = 0;
    batchResponses.forEach((res) => {
      (res.entries || []).forEach((entry: any) => {
        if (entry.errors && entry.errors.errors && entry.errors.errors.length > 0) {
          const sku = entry.product?.offerId || `entry-${entry.batchId}`;
          errors.push({
            sku,
            error: entry.errors.errors.map((e: any) => e.message).join("; "),
          });
        } else {
          successCount++;
        }
      });
    });

    return {
      success: errors.length === 0,
      mode: "api",
      totalProducts,
      totalVariants,
      syncedVariants: successCount,
      errors,
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      success: false,
      mode: "api",
      totalProducts,
      totalVariants,
      syncedVariants: 0,
      errors: [
        {
          sku: "BATCH_GLOBAL",
          error: err.message || "Failed to execute GMC API request",
        },
      ],
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Syncs a single product by ID to Google Merchant Center
 */
export async function syncSingleProductToGMC(
  productId: string,
  config: GMCConfig = getGMCConfig()
): Promise<GMCSyncResult> {
  const isConfigured = isGMCConfigured(config);
  const client = getGMCClient(config);

  const products = await fetchProductsForGMC();
  const product = products.find((p) => p.id === productId);

  if (!product) {
    throw new Error(`Product with ID ${productId} not found.`);
  }

  const errors: Array<{ sku: string; error: string }> = [];
  const gmcItems: GMCProductItem[] = [];

  for (const variant of product.variants) {
    try {
      const item = buildGMCProductItem(product, variant, config);
      gmcItems.push(item);
    } catch (err: any) {
      errors.push({
        sku: variant.sku,
        error: err.message || "Failed to build GMC product payload",
      });
    }
  }

  if (!isConfigured || !client) {
    return {
      success: true,
      mode: "dry-run",
      totalProducts: 1,
      totalVariants: product.variants.length,
      syncedVariants: gmcItems.length,
      errors,
      batchResults: gmcItems.map((i) => ({
        offerId: i.offerId,
        title: i.title,
        price: `${i.price.value} ${i.price.currency}`,
        status: "validated_dry_run",
      })),
      timestamp: new Date().toISOString(),
    };
  }

  let successCount = 0;
  for (const item of gmcItems) {
    try {
      await client.products.insert({
        merchantId: config.merchantId,
        requestBody: item as any,
      });
      successCount++;
    } catch (err: any) {
      errors.push({
        sku: item.offerId,
        error: err.message || "GMC Product insert failed",
      });
    }
  }

  return {
    success: errors.length === 0,
    mode: "api",
    totalProducts: 1,
    totalVariants: product.variants.length,
    syncedVariants: successCount,
    errors,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Deletes a product variant from Google Merchant Center by offerId (SKU)
 */
export async function deleteVariantFromGMC(
  offerId: string,
  config: GMCConfig = getGMCConfig()
): Promise<{ success: boolean; mode: "api" | "dry-run"; error?: string }> {
  const isConfigured = isGMCConfigured(config);
  const client = getGMCClient(config);

  const productId = `online:${config.contentLanguage || "en"}:${config.targetCountry || "PK"}:${offerId}`;

  if (!isConfigured || !client) {
    return {
      success: true,
      mode: "dry-run",
    };
  }

  try {
    await client.products.delete({
      merchantId: config.merchantId,
      productId,
    });
    return { success: true, mode: "api" };
  } catch (err: any) {
    return { success: false, mode: "api", error: err.message || "Failed to delete product from GMC" };
  }
}
