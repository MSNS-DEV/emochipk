import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";

export const wishlistRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return ctx.db.wishlistItem.findMany({
      where: { userId },
      orderBy: { addedAt: "desc" },
      include: {
        product: {
          include: {
            images: { where: { isPrimary: true }, take: 1 },
            variants: { where: { isActive: true }, take: 1 },
          },
        },
      },
    });
  }),

  add: protectedProcedure.input(z.string()).mutation(async ({ ctx, input: productId }) => {
    const userId = ctx.session.user.id;
    const existing = await ctx.db.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (existing) return existing;
    return ctx.db.wishlistItem.create({ data: { userId, productId } });
  }),

  remove: protectedProcedure.input(z.string()).mutation(({ ctx, input: productId }) =>
    ctx.db.wishlistItem.deleteMany({ where: { userId: ctx.session.user.id, productId } })
  ),

  moveToCart: protectedProcedure
    .input(z.object({ productId: z.string(), variantId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      await ctx.db.cartItem.upsert({
        where: { userId_variantId: { userId, variantId: input.variantId } },
        create: { userId, variantId: input.variantId, quantity: 1 },
        update: { quantity: { increment: 1 } },
      });
      await ctx.db.wishlistItem.deleteMany({ where: { userId, productId: input.productId } });
      return { success: true };
    }),
});
