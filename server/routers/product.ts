import { z } from "zod";
import { createTRPCRouter, publicProcedure, adminProcedure } from "@/server/trpc";
import type { Prisma } from "@prisma/client";

// ─── Zod Input Schemas ───────────────────────────────────────────────────────

const ProductCreateSchema = z.object({
  articleNumber: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  basePrice: z.number().positive(),
  salePrice: z.number().positive().optional(),
  category: z.enum(["MEN", "WOMEN", "KIDS"]),
  style: z.enum(["LOAFERS", "OXFORD", "MOCCASINS", "PESHAWARI", "SANDALS", "SNEAKERS"]),
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
    url: z.string().url(),
    altText: z.string().optional(),
    isPrimary: z.boolean().default(false),
    colorTag: z.string().optional(),
    sortOrder: z.number().default(0),
  })).optional(),
});

const ProductUpdateSchema = ProductCreateSchema.partial().extend({ id: z.string() });

const GetAllInput = z.object({
  style: z.enum(["LOAFERS", "OXFORD", "MOCCASINS", "PESHAWARI", "SANDALS", "SNEAKERS"]).optional(),
  category: z.enum(["MEN", "WOMEN", "KIDS"]).optional(),
  occasion: z.enum(["ETHNIC", "WEDDING", "SPORTS", "FORMAL", "CASUAL"]).optional(),
  search: z.string().optional(),
  onSale: z.boolean().optional(),
  featured: z.boolean().optional(),
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
      ...(input?.category && { category: input.category }),
      ...(input?.style && { style: input.style }),
      ...(input?.occasion && { occasion: { has: input.occasion } }),
      ...(input?.featured && { isFeatured: true }),
      ...(input?.onSale && { salePrice: { not: null } }),
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
          images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 },
          variants: { where: { isActive: true }, take: 1 },
          _count: { select: { reviews: { where: { isApproved: true } } } },
        },
      }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }),

  /** Single product for PDP — includes all variants, images, reviews */
  getBySlug: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return ctx.db.product.findFirst({
      where: { slug: input, isActive: true },
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
      where: { isFeatured: true, isActive: true },
      take: 8,
      orderBy: { updatedAt: "desc" },
      include: {
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 },
        variants: { where: { isActive: true }, take: 1 },
      },
    })
  ),

  /** New arrivals — newest 8 products */
  getNewArrivals: publicProcedure.query(({ ctx }) =>
    ctx.db.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 },
        variants: { where: { isActive: true }, take: 1 },
      },
    })
  ),

  /** On-sale products */
  getOnSale: publicProcedure.query(({ ctx }) =>
    ctx.db.product.findMany({
      where: { isActive: true, salePrice: { not: null } },
      orderBy: { updatedAt: "desc" },
      take: 8,
      include: {
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 },
        variants: { where: { isActive: true }, take: 1 },
      },
    })
  ),

  /** Autocomplete search */
  search: publicProcedure.input(z.string().min(1)).query(({ ctx, input }) =>
    ctx.db.product.findMany({
      where: {
        isActive: true,
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
    return ctx.db.product.create({
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
  }),

  /** Update product fields (admin) */
  update: adminProcedure.input(ProductUpdateSchema).mutation(async ({ ctx, input }) => {
    const { id, variants, images, ...data } = input;
    return ctx.db.product.update({
      where: { id },
      data,
    });
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
      url: z.string().url(),
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
      amount: z.number(),
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

  /** Get all unique brands (derived from product name prefix) for filter dropdown */
  getBrands: adminProcedure.query(async ({ ctx }) => {
    const products = await ctx.db.product.findMany({
      select: { name: true },
      distinct: ["name"],
    });
    // Extract brand from name (first word before space)
    const brandSet = new Set<string>();
    for (const p of products) {
      const parts = p.name.split(" ");
      if (parts.length > 0) {
        brandSet.add(parts[0]);
      }
    }
    return Array.from(brandSet).sort();
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
      category: z.enum(["MEN", "WOMEN", "KIDS"]).optional(),
      style: z.enum(["LOAFERS", "OXFORD", "MOCCASINS", "PESHAWARI", "SANDALS", "SNEAKERS"]).optional(),
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
        ...(input.style && { style: input.style }),
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
            _count: { select: { variants: true, reviews: true } },
          },
        }),
      ]);
      return { items, total, page: input.page, pageSize: input.pageSize, totalPages: Math.ceil(total / input.pageSize) };
    }),
});
