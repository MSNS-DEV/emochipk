import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";

const AddressSchema = z.object({
  label: z.string().max(50).optional(),
  fullName: z.string().min(1).max(100),
  phone: z.string().min(10).max(20),
  street: z.string().min(1).max(250),
  city: z.string().min(1).max(100),
  province: z.string().min(1).max(100),
  postalCode: z.string().max(20).optional(),
  country: z.string().default("Pakistan"),
  isDefault: z.boolean().default(false),
});

export const customerRouter = createTRPCRouter({
  /** Get customer profile with loyalty info — excludes password hash */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const user = await ctx.db.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        customerProfile: {
          include: {
            addresses: true,
            sizePreferences: true,
            storeCredits: { where: { status: "ACTIVE" } },
          },
        },
      },
    });
    return user;
  }),

  /** Update customer profile */
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100).optional(),
        phone: z.string().max(20).optional(),
        newsletterOptIn: z.boolean().optional(),
        dateOfBirth: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { newsletterOptIn, dateOfBirth, ...userFields } = input;
      if (Object.keys(userFields).length > 0) {
        await ctx.db.user.update({ where: { id: userId }, data: userFields });
      }
      if (newsletterOptIn !== undefined || dateOfBirth !== undefined) {
        await ctx.db.customer.upsert({
          where: { userId },
          create: {
            userId,
            ...(newsletterOptIn !== undefined && { newsletterOptIn }),
            ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
          },
          update: {
            ...(newsletterOptIn !== undefined && { newsletterOptIn }),
            ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
          },
        });
      }
      return { success: true };
    }),

  // ─── Addresses (IDOR-Protected) ──────────────────────────────────────────

  getAddresses: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const customer = await ctx.db.customer.findUnique({ where: { userId } });
    if (!customer) return [];
    return ctx.db.address.findMany({
      where: { customerId: customer.id },
      orderBy: [{ isDefault: "desc" }, { id: "asc" }],
    });
  }),

  addAddress: protectedProcedure.input(AddressSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;
    const customer = await ctx.db.customer.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
    if (input.isDefault) {
      await ctx.db.address.updateMany({
        where: { customerId: customer.id },
        data: { isDefault: false },
      });
    }
    return ctx.db.address.create({ data: { customerId: customer.id, ...input } });
  }),

  updateAddress: protectedProcedure
    .input(AddressSchema.partial().extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const customer = await ctx.db.customer.findUniqueOrThrow({ where: { userId } });
      const addr = await ctx.db.address.findUniqueOrThrow({ where: { id: input.id } });

      if (addr.customerId !== customer.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Unauthorized: Address does not belong to your account.",
        });
      }

      const { id, isDefault, ...data } = input;
      if (isDefault) {
        await ctx.db.address.updateMany({
          where: { customerId: customer.id },
          data: { isDefault: false },
        });
      }
      return ctx.db.address.update({ where: { id }, data: { isDefault, ...data } });
    }),

  deleteAddress: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;
    const customer = await ctx.db.customer.findUniqueOrThrow({ where: { userId } });
    const addr = await ctx.db.address.findUniqueOrThrow({ where: { id: input } });

    if (addr.customerId !== customer.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Unauthorized: Address does not belong to your account.",
      });
    }

    return ctx.db.address.delete({ where: { id: input } });
  }),

  // ─── Size Preferences (FR-CRM-03) ──────────────────────────────────────────

  getSizePreferences: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const customer = await ctx.db.customer.findUnique({ where: { userId } });
    if (!customer) return [];
    return ctx.db.sizePreference.findMany({ where: { customerId: customer.id } });
  }),

  saveSizePreference: protectedProcedure
    .input(
      z.object({
        style: z.enum([
          "SPORTS",
          "SNEAKERS",
          "SKECHERS",
          "FORMAL_MOCCASINS",
          "LOAFERS_MOZA",
          "CHAPPAL",
          "SANDALS",
          "PESHAWARI_KHUSSA",
          "COURT_SHOES",
          "CASUAL_SHOES",
          "BUMPS",
          "SCHOOL",
          "ACCESSORIES",
          "LOAFERS",
          "OXFORD",
          "MOCCASINS",
          "PESHAWARI",
        ]),
        sizeUK: z.string().max(20),
        width: z.enum(["STANDARD", "WIDE", "EXTRA_WIDE"]).default("STANDARD"),
        notes: z.string().max(250).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const customer = await ctx.db.customer.upsert({
        where: { userId },
        create: { userId },
        update: {},
      });
      return ctx.db.sizePreference.upsert({
        where: { customerId_style: { customerId: customer.id, style: input.style } },
        create: { customerId: customer.id, ...input },
        update: { sizeUK: input.sizeUK, width: input.width, notes: input.notes },
      });
    }),

  // ─── Store Credit ───────────────────────────────────────────────────────────

  getStoreCredits: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const customer = await ctx.db.customer.findUnique({ where: { userId } });
    if (!customer) return { active: [], expired: [], totalAvailable: 0 };
    const credits = await ctx.db.storeCredit.findMany({
      where: { customerId: customer.id },
      orderBy: { issuedAt: "desc" },
    });
    const active = credits.filter((c) => c.status === "ACTIVE" && c.expiresAt > new Date());
    const totalAvailable = active.reduce((s, c) => s + Number(c.remaining), 0);
    return { active, expired: credits.filter((c) => c.status !== "ACTIVE"), totalAvailable };
  }),

  // ─── Loyalty ────────────────────────────────────────────────────────────────

  getLoyaltyInfo: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const customer = await ctx.db.customer.findUnique({ where: { userId } });
    return customer
      ? { points: customer.loyaltyPoints, tier: customer.loyaltyTier }
      : { points: 0, tier: "BRONZE" };
  }),
});
