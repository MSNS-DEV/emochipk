import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";

const AddressSchema = z.object({
  label: z.string().optional(),
  fullName: z.string().min(1),
  phone: z.string().min(10),
  street: z.string().min(1),
  city: z.string().min(1),
  province: z.string().min(1),
  postalCode: z.string().optional(),
  country: z.string().default("Pakistan"),
  isDefault: z.boolean().default(false),
});

export const customerRouter = createTRPCRouter({
  /** Get customer profile with loyalty info */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const user = await ctx.db.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
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
    .input(z.object({
      name: z.string().min(1).optional(),
      phone: z.string().optional(),
      newsletterOptIn: z.boolean().optional(),
      dateOfBirth: z.string().optional(),
    }))
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

  // ─── Addresses ─────────────────────────────────────────────────────────────

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
      const { id, isDefault, ...data } = input;
      if (isDefault) {
        const addr = await ctx.db.address.findUniqueOrThrow({ where: { id } });
        await ctx.db.address.updateMany({
          where: { customerId: addr.customerId },
          data: { isDefault: false },
        });
      }
      return ctx.db.address.update({ where: { id }, data: { isDefault, ...data } });
    }),

  deleteAddress: protectedProcedure.input(z.string()).mutation(({ ctx, input }) =>
    ctx.db.address.delete({ where: { id: input } })
  ),

  // ─── Size Preferences (FR-CRM-03) ──────────────────────────────────────────

  getSizePreferences: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const customer = await ctx.db.customer.findUnique({ where: { userId } });
    if (!customer) return [];
    return ctx.db.sizePreference.findMany({ where: { customerId: customer.id } });
  }),

  saveSizePreference: protectedProcedure
    .input(z.object({
      style: z.enum(["LOAFERS", "OXFORD", "MOCCASINS", "PESHAWARI", "SANDALS", "SNEAKERS"]),
      sizeUK: z.string(),
      width: z.enum(["STANDARD", "WIDE", "EXTRA_WIDE"]).default("STANDARD"),
      notes: z.string().optional(),
    }))
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
