import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";

export const cartRouter = createTRPCRouter({
  /** Load server-side cart for authenticated user */
  get: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const items = await ctx.db.cartItem.findMany({
      where: { userId },
      include: {
        variant: {
          include: {
            product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
            inventory: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const subtotal = items.reduce(
      (sum: number, item: typeof items[0]) =>
        sum +
        item.quantity *
          (Number(item.variant.product.salePrice ?? item.variant.product.basePrice) +
            Number(item.variant.priceDelta)),
      0
    );
    const shippingCost = subtotal >= 5000 ? 0 : 250;

    return { items, subtotal, shippingCost, total: subtotal + shippingCost };
  }),

  /** Add item — creates or increments quantity */
  addItem: protectedProcedure
    .input(z.object({ variantId: z.string(), quantity: z.number().int().positive().max(50).default(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const variant = await ctx.db.productVariant.findUnique({
        where: { id: input.variantId },
      });
      if (!variant || !variant.isActive) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product variant not found or no longer available.",
        });
      }

      const existing = await ctx.db.cartItem.findUnique({
        where: { userId_variantId: { userId, variantId: input.variantId } },
      });
      if (existing) {
        return ctx.db.cartItem.update({
          where: { userId_variantId: { userId, variantId: input.variantId } },
          data: { quantity: { increment: input.quantity } },
        });
      }
      return ctx.db.cartItem.create({
        data: { userId, variantId: input.variantId, quantity: input.quantity },
      });
    }),

  /** Update quantity for a cart item (IDOR-protected) */
  updateItem: protectedProcedure
    .input(z.object({ cartItemId: z.string(), quantity: z.number().int().positive().max(50) }))
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.cartItem.findUnique({
        where: { id: input.cartItemId },
      });
      if (!item || item.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cart item not found or unauthorized.",
        });
      }
      return ctx.db.cartItem.update({
        where: { id: input.cartItemId },
        data: { quantity: input.quantity },
      });
    }),

  /** Remove a cart item (IDOR-protected) */
  removeItem: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    const item = await ctx.db.cartItem.findUnique({
      where: { id: input },
    });
    if (!item || item.userId !== ctx.session.user.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Cart item not found or unauthorized.",
      });
    }
    return ctx.db.cartItem.delete({ where: { id: input } });
  }),

  /** Clear entire cart */
  clear: protectedProcedure.mutation(({ ctx }) =>
    ctx.db.cartItem.deleteMany({ where: { userId: ctx.session.user.id } })
  ),

  /** Merge guest cart (localStorage items) into server cart on login */
  mergeGuestCart: protectedProcedure
    .input(z.array(z.object({ variantId: z.string(), quantity: z.number().int().positive().max(50) })))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      if (input.length === 0) return { success: true };

      // Verify variant existence and active status
      const validVariants = await ctx.db.productVariant.findMany({
        where: { id: { in: input.map((i) => i.variantId) }, isActive: true },
        select: { id: true },
      });
      const validVariantIds = new Set(validVariants.map((v) => v.id));
      const validItems = input.filter((item) => validVariantIds.has(item.variantId));

      // Aggregate quantities by variantId to prevent duplicate key race conditions
      const itemMap = new Map<string, number>();
      for (const item of validItems) {
        itemMap.set(item.variantId, (itemMap.get(item.variantId) ?? 0) + item.quantity);
      }

      for (const [variantId, quantity] of itemMap.entries()) {
        await ctx.db.cartItem.upsert({
          where: { userId_variantId: { userId, variantId } },
          create: { userId, variantId, quantity: Math.min(50, quantity) },
          update: { quantity: { increment: quantity } },
        });
      }
      return { success: true };
    }),
});
