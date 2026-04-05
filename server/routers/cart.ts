import { z } from "zod";
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
    .input(z.object({ variantId: z.string(), quantity: z.number().int().positive().default(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
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

  /** Update quantity for a cart item */
  updateItem: protectedProcedure
    .input(z.object({ cartItemId: z.string(), quantity: z.number().int().positive() }))
    .mutation(({ ctx, input }) =>
      ctx.db.cartItem.update({
        where: { id: input.cartItemId },
        data: { quantity: input.quantity },
      })
    ),

  /** Remove a cart item */
  removeItem: protectedProcedure.input(z.string()).mutation(({ ctx, input }) =>
    ctx.db.cartItem.delete({ where: { id: input } })
  ),

  /** Clear entire cart */
  clear: protectedProcedure.mutation(({ ctx }) =>
    ctx.db.cartItem.deleteMany({ where: { userId: ctx.session.user.id } })
  ),

  /** Merge guest cart (localStorage items) into server cart on login */
  mergeGuestCart: protectedProcedure
    .input(z.array(z.object({ variantId: z.string(), quantity: z.number().int().positive() })))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      await Promise.all(
        input.map(async (item) => {
          const existing = await ctx.db.cartItem.findUnique({
            where: { userId_variantId: { userId, variantId: item.variantId } },
          });
          if (existing) {
            return ctx.db.cartItem.update({
              where: { userId_variantId: { userId, variantId: item.variantId } },
              data: { quantity: { increment: item.quantity } },
            });
          }
          return ctx.db.cartItem.create({
            data: { userId, variantId: item.variantId, quantity: item.quantity },
          });
        })
      );
      return { success: true };
    }),
});
