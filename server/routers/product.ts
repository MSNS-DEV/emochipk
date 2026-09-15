import { z } from "zod";
import { createTRPCRouter, publicProcedure, adminProcedure } from "@/server/trpc";
import type { Prisma } from "@prisma/client";
import { knownBrands } from "@/lib/utils/catalog";

// ─── Zod Input Schemas ───────────────────────────────────────────────────────

const ProductCreateSchema = z.object({
  articleNumber: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  basePrice: z.number().positive(),
  salePrice: z.number().positive().optional(),
  category: z.enum(["MEN", "WOMEN", "KIDS", "ACCESSORIES"]),
  style: z.enum([
    "SPORTS", "SNEAKERS", "SKECHERS", "FORMAL_MOCCASINS", "LOAFERS_MOZA",
    "CHAPPAL", "SANDALS", "PESHAWARI_KHUSSA", "COURT_SHOES", "CASUAL_SHOES",
    "BUMPS", "SCHOOL", "ACCESSORIES", "LOAFERS", "OXFORD", "MOCCASINS", "PESHAWARI"
  ]),
  leatherType: z.enum(["CALF_SKIN", "GOAT_LEATHER", "SUEDE", "NUBUCK", "PREMIUM_SYNTHETIC"]),
  occasion: z.array(z.enum(["ETHNIC", "WEDDING", "SPORTS", "FORMAL", "CASUAL"])),
  manufacturingCity: z.string(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  isFeatured: z.boolean().default(false),
  variants: z.array(z.object({
    sku: z.string(),
    sizeUK: z.string(),
    sizeUS: z.string(),
    sizeEU: z.string(),
    sizeCM: z.string(),
    color: z.string(),
    colorHex: z.string(),
    width: z.enum(["STANDARD", "WIDE", "EXTRA_WIDE"]).default("STANDARD"),
    priceDelta: z.number().default(0),
  })),
  images: z.array(z.object({
    url: z.string().min(1, "Invalid image URL"),
    altText: z.string().optional(),
    isPrimary: z.boolean().default(false),
    colorTag: z.string().optional(),
    sortOrder: z.number().default(0),
  })).optional(),
});

const ProductUpdateSchema = ProductCreateSchema.partial().extend({ id: z.string() });

const GetAllInput = z.object({
  style: z.enum([
    "SPORTS", "SNEAKERS", "SKECHERS", "FORMAL_MOCCASINS", "LOAFERS_MOZA",
    "CHAPPAL", "SANDALS", "PESHAWARI_KHUSSA", "COURT_SHOES", "CASUAL_SHOES",
    "BUMPS", "SCHOOL", "ACCESSORIES", "LOAFERS", "OXFORD", "MOCCASINS", "PESHAWARI"
  ]).optional(),
  category: z.enum(["MEN", "WOMEN", "KIDS", "ACCESSORIES"]).optional(),
  occasion: z.enum(["ETHNIC", "WEDDING", "SPORTS", "FORMAL", "CASUAL"]).optional(),
  search: z.string().optional(),
  onSale: z.boolean().optional(),
  featured: z.boolean().optional(),
  brand: z.string().optional(),
  sizes: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
  sortBy: z.enum(["newest", "price-asc", "price-desc", "rating", "popularity"]).optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(12),
}).optional();

// ─── Router ─────────────────────────────────────────────────────────────────

export const productRouter = createTRPCRouter({
  /** List products with filters, sorting, pagination */
  getAll: publicProcedure.input(GetAllInput).query(async ({ ctx, input }) => {
    const page = input?.page ?? 1;
    const pageSize = input?.pageSize ?? 12;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {
      isActive: true,
      // Only show products that have at least one image on the storefront
      images: { some: {} },
      ...(input?.category && { category: input.category }),
      ...(input?.style && {
        style: input.style === 'FORMAL_MOCCASINS' ? { in: ['FORMAL_MOCCASINS', 'MOCCASINS', 'OXFORD'] }
             : input.style === 'LOAFERS_MOZA' ? { in: ['LOAFERS_MOZA', 'LOAFERS'] }
             : input.style === 'PESHAWARI_KHUSSA' ? { in: ['PESHAWARI_KHUSSA', 'PESHAWARI'] }
             : input.style === 'CHAPPAL' ? { in: ['CHAPPAL', 'SANDALS'] }
             : input.style
      }),
      ...(input?.occasion && { occasion: { has: input.occasion } }),
      ...(input?.featured && { isFeatured: true }),
      ...(input?.onSale && { salePrice: { not: null } }),
      ...(input?.brand && {
        name: { startsWith: input.brand, mode: "insensitive" },
      }),
      ...(input?.search && {
        OR: [
          { name: { contains: input.search, mode: "insensitive" } },
          { description: { contains: input.search, mode: "insensitive" } },
          { articleNumber: { contains: input.search, mode: "insensitive" } },
        ],
      }),
      ...(input?.priceMin !== undefined || input?.priceMax !== undefined
        ? {
          basePrice: {
            ...(input?.priceMin !== undefined && { gte: input.priceMin }),
            ...(input?.priceMax !== undefined && { lte: input.priceMax }),
          },
        }
        : {}),
      ...(input?.sizes && input.sizes.length > 0
        ? { variants: { some: { sizeUK: { in: input.sizes }, isActive: true } } }
        : {}),
      ...(input?.colors && input.colors.length > 0
        ? { variants: { some: { color: { in: input.colors }, isActive: true } } }
        : {}),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderBy: Record<string, any> =
      input?.sortBy === "price-asc"
        ? { basePrice: "asc" }
        : input?.sortBy === "price-desc"
          ? { basePrice: "desc" }
          : input?.sortBy === "popularity"
            ? { reviews: { _count: "desc" } }
            : { createdAt: "desc" }; // newest (default)

    const [total, items] = await Promise.all([
      ctx.db.product.count({ where }),
      ctx.db.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
          variants: { where: { isActive: true } },
          _count: { select: { reviews: { where: { isApproved: true } } } },
        },
      }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }),

  /** Single product for PDP — includes all variants, images, reviews */
  getBySlug: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return ctx.db.product.findFirst({
      // Only show products that have at least one image on the storefront
      where: { slug: input, isActive: true, images: { some: {} } },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: {
          where: { isActive: true },
          include: { inventory: { include: { branch: true } } },
        },
        reviews: {
          where: { isApproved: true },
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { customer: { include: { user: { select: { name: true } } } } },
        },
        _count: { select: { reviews: { where: { isApproved: true } } } },
      },
    });
  }),

  getById: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return ctx.db.product.findUnique({
      where: { id: input },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: {
          where: { isActive: true },
          include: { inventory: true },
        },
      },
    });
  }),

  /** Featured products for homepage */
  getFeatured: publicProcedure.query(({ ctx }) =>
    ctx.db.product.findMany({
      // Only show products that have at least one image on the storefront
      where: { isFeatured: true, isActive: true, images: { some: {} } },
      take: 8,
      orderBy: { updatedAt: "desc" },
      include: {
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        variants: { where: { isActive: true } },
      },
    })
  ),

  /** New arrivals — newest 8 products */
  getNewArrivals: publicProcedure.query(({ ctx }) =>
    ctx.db.product.findMany({
      // Only show products that have at least one image on the storefront
      where: { isActive: true, images: { some: {} } },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        variants: { where: { isActive: true } },
      },
    })
  ),

  /** On-sale products */
  getOnSale: publicProcedure.query(({ ctx }) =>
    ctx.db.product.findMany({
      // Only show products that have at least one image on the storefront
      where: { isActive: true, salePrice: { not: null }, images: { some: {} } },
      orderBy: { updatedAt: "desc" },
      take: 8,
      include: {
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        variants: { where: { isActive: true } },
      },
    })
  ),

  /** Autocomplete search */
  search: publicProcedure.input(z.string().min(1)).query(({ ctx, input }) =>
    ctx.db.product.findMany({
      where: {
        isActive: true,
        // Only show products that have at least one image on the storefront
        images: { some: {} },
        OR: [
          { name: { contains: input, mode: "insensitive" } },
          { articleNumber: { contains: input, mode: "insensitive" } },
        ],
      },
      take: 10,
      select: {
        id: true, name: true, slug: true, basePrice: true, salePrice: true,
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1, select: { url: true, altText: true } },
      },
    })
  ),

  // ─── Admin CRUD ─────────────────────────────────────────────────────────────

  /** Create product with variants and images (admin) */
  create: adminProcedure.input(ProductCreateSchema).mutation(async ({ ctx, input }) => {
    const { variants, images, ...productData } = input;
    try {
      return await ctx.db.product.create({
        data: {
          ...productData,
          basePrice: productData.basePrice,
          salePrice: productData.salePrice,
          variants: {
            create: variants.map((v) => ({
              sku: v.sku,
              sizeUK: v.sizeUK,
              sizeUS: v.sizeUS,
              sizeEU: v.sizeEU,
              sizeCM: v.sizeCM,
              color: v.color,
              colorHex: v.colorHex,
              width: v.width,
              priceDelta: v.priceDelta,
            })),
          },
          images: images
            ? { create: images }
            : undefined,
        },
        include: { variants: true, images: true },
      });
    } catch (error: any) {
      if (error?.code === "P2002") {
        const target = error.meta?.target;
        if (Array.isArray(target) && target.includes("sku")) {
          throw new Error("One or more variant SKUs already exist in the database. Please ensure Article Number is unique.");
        }
        if (Array.isArray(target) && target.includes("articleNumber")) {
          throw new Error("A product with this Article Number already exists.");
        }
        if (Array.isArray(target) && target.includes("slug")) {
          throw new Error("A product with this URL Slug already exists.");
        }
      }
      throw error;
    }
  }),

  /** Update product fields and variants (admin) */
  update: adminProcedure.input(ProductUpdateSchema).mutation(async ({ ctx, input }) => {
    const { id, variants, images, ...data } = input;

    const product = await ctx.db.product.update({
      where: { id },
      data,
    });

    if (variants && Array.isArray(variants)) {
      const existingVariants = await ctx.db.productVariant.findMany({
        where: { productId: id },
      });

      // Step 1: Temporarily update all existing variant SKUs to prevent unique constraint (P2002) collision during sync
      for (const ex of existingVariants) {
        await ctx.db.productVariant.update({
          where: { id: ex.id },
          data: { sku: `tmp_${ex.id}_${Date.now()}` },
        });
      }

      const matchedExistingIds = new Set<string>();
      const variantToExistingMap = new Map<typeof variants[number], typeof existingVariants[number]>();

      for (const v of variants) {
        const match = existingVariants.find(
          (ex) =>
            !matchedExistingIds.has(ex.id) &&
            ex.sizeUK === v.sizeUK &&
            ex.color.trim().toLowerCase() === v.color.trim().toLowerCase()
        );
        if (match) {
          matchedExistingIds.add(match.id);
          variantToExistingMap.set(v, match);
        }
      }

      const unusedVariants = existingVariants.filter((ex) => !matchedExistingIds.has(ex.id));

      // Step 2: Delete or archive unused variants
      for (const unused of unusedVariants) {
        try {
          await ctx.db.productVariant.delete({ where: { id: unused.id } });
        } catch {
          await ctx.db.productVariant.update({
            where: { id: unused.id },
            data: {
              isActive: false,
              sku: `${unused.sku}-archived-${unused.id}`,
            },
          });
        }
      }

      // Step 3: Update matched variants and create new variants
      for (const v of variants) {
        const match = variantToExistingMap.get(v);
        if (match) {
          await ctx.db.productVariant.update({
            where: { id: match.id },
            data: {
              sku: v.sku,
              sizeUS: v.sizeUS,
              sizeEU: v.sizeEU,
              sizeCM: v.sizeCM,
              colorHex: v.colorHex,
              width: v.width,
              priceDelta: v.priceDelta,
              isActive: true,
            },
          });
        } else {
          await ctx.db.productVariant.create({
            data: {
              productId: id,
              sku: v.sku,
              sizeUK: v.sizeUK,
              sizeUS: v.sizeUS,
              sizeEU: v.sizeEU,
              sizeCM: v.sizeCM,
              color: v.color,
              colorHex: v.colorHex,
              width: v.width,
              priceDelta: v.priceDelta,
              isActive: true,
            },
          });
        }
      }
    }

    return product;
  }),

  /** Toggle active status (admin) */
  toggleActive: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    const product = await ctx.db.product.findUniqueOrThrow({ where: { id: input } });
    return ctx.db.product.update({ where: { id: input }, data: { isActive: !product.isActive } });
  }),

  /** Add image to product (admin) */
  addImage: adminProcedure
    .input(z.object({
      productId: z.string(),
      url: z.string().min(1, "Invalid image URL"),
      altText: z.string().optional(),
      isPrimary: z.boolean().default(false),
      colorTag: z.string().optional(),
      sortOrder: z.number().default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const { productId, ...imageData } = input;
      // If this is set as primary, clear other primary flags
      if (imageData.isPrimary) {
        await ctx.db.productImage.updateMany({
          where: { productId },
          data: { isPrimary: false },
        });
      }
      return ctx.db.productImage.create({ data: { productId, ...imageData } });
    }),

  /** Delete image (admin) */
  deleteImage: adminProcedure.input(z.string()).mutation(({ ctx, input }) =>
    ctx.db.productImage.delete({ where: { id: input } })
  ),

  /** Update a single variant (admin) */
  updateVariant: adminProcedure
    .input(z.object({
      id: z.string(),
      sku: z.string().optional(),
      priceDelta: z.number().optional(),
      isActive: z.boolean().optional(),
      color: z.string().optional(),
      colorHex: z.string().optional(),
    }))
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.productVariant.update({ where: { id }, data });
    }),

  /** Bulk price update — percentage or fixed (admin) */
  bulkUpdatePrice: adminProcedure
    .input(z.object({
      productId: z.string(),
      type: z.enum(["percentage", "fixed"]),
      amount: z.number().min(-90).max(1000000),
    }))
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.db.product.findUniqueOrThrow({ where: { id: input.productId } });
      const newBase =
        input.type === "percentage"
          ? Number(product.basePrice) * (1 + input.amount / 100)
          : Number(product.basePrice) + input.amount;
      return ctx.db.product.update({
        where: { id: input.productId },
        data: { basePrice: Math.max(0, newBase) },
      });
    }),

  /** Get all unique brands for filter dropdown — public */
  getBrands: publicProcedure.query(async () => {
    return [...knownBrands];
  }),

  /** Get all unique colors across variants for filter dropdown */
  getColors: adminProcedure.query(async ({ ctx }) => {
    const variants = await ctx.db.productVariant.findMany({
      select: { color: true, colorHex: true },
      distinct: ["color"],
      orderBy: { color: "asc" },
    });
    return variants;
  }),

  /** Paginated list for admin table — with advanced filters */
  adminList: adminProcedure
    .input(z.object({
      page: z.number().default(1),
      pageSize: z.number().default(20),
      search: z.string().optional(),
      category: z.enum(["MEN", "WOMEN", "KIDS", "ACCESSORIES"]).optional(),
      style: z.enum([
        "SPORTS", "SNEAKERS", "SKECHERS", "FORMAL_MOCCASINS", "LOAFERS_MOZA",
        "CHAPPAL", "SANDALS", "PESHAWARI_KHUSSA", "COURT_SHOES", "CASUAL_SHOES",
        "BUMPS", "SCHOOL", "ACCESSORIES", "LOAFERS", "OXFORD", "MOCCASINS", "PESHAWARI"
      ]).optional(),
      brand: z.string().optional(),
      color: z.string().optional(),
      isActive: z.boolean().optional(),
      priceMin: z.number().optional(),
      priceMax: z.number().optional(),
      sortBy: z.enum(["newest", "oldest", "name-asc", "name-desc", "price-asc", "price-desc", "article-asc"]).default("newest"),
    }))
    .query(async ({ ctx, input }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: Record<string, any> = {
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        ...(input.category && { category: input.category }),
        ...(input.style && {
          style: input.style === 'FORMAL_MOCCASINS' ? { in: ['FORMAL_MOCCASINS', 'MOCCASINS', 'OXFORD'] }
               : input.style === 'LOAFERS_MOZA' ? { in: ['LOAFERS_MOZA', 'LOAFERS'] }
               : input.style === 'PESHAWARI_KHUSSA' ? { in: ['PESHAWARI_KHUSSA', 'PESHAWARI'] }
               : input.style === 'CHAPPAL' ? { in: ['CHAPPAL', 'SANDALS'] }
               : input.style
        }),
        ...(input.brand && {
          name: { startsWith: input.brand, mode: "insensitive" },
        }),
        ...(input.color && {
          variants: { some: { color: { equals: input.color, mode: "insensitive" } } },
        }),
        ...(input.priceMin !== undefined || input.priceMax !== undefined
          ? {
            basePrice: {
              ...(input.priceMin !== undefined && { gte: input.priceMin }),
              ...(input.priceMax !== undefined && { lte: input.priceMax }),
            },
          }
          : {}),
        ...(input.search && {
          OR: [
            { name: { contains: input.search, mode: "insensitive" } },
            { articleNumber: { contains: input.search, mode: "insensitive" } },
            { description: { contains: input.search, mode: "insensitive" } },
          ],
        }),
      };

      // Sort options
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let orderBy: any = { createdAt: "desc" };
      switch (input.sortBy) {
        case "oldest": orderBy = { createdAt: "asc" }; break;
        case "name-asc": orderBy = { name: "asc" }; break;
        case "name-desc": orderBy = { name: "desc" }; break;
        case "price-asc": orderBy = { basePrice: "asc" }; break;
        case "price-desc": orderBy = { basePrice: "desc" }; break;
        case "article-asc": orderBy = { articleNumber: "asc" }; break;
      }

      const [total, items] = await Promise.all([
        ctx.db.product.count({ where }),
        ctx.db.product.findMany({
          where,
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          orderBy,
          include: {
            images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 },
            _count: { select: { variants: { where: { isActive: true } }, reviews: true } },
          },
        }),
      ]);
      return { items, total, page: input.page, pageSize: input.pageSize, totalPages: Math.ceil(total / input.pageSize) };
    }),
});
