import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure, adminProcedure } from "@/server/trpc";

export const reviewRouter = createTRPCRouter({
  /** Public reviews for a product PDP */
  getByProduct: publicProcedure.input(z.string()).query(({ ctx, input: productId }) =>
    ctx.db.review.findMany({
      where: { productId, isApproved: true },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { customer: { include: { user: { select: { name: true } } } } },
    })
  ),

  /** Submit review — must have purchased (FR-CUS-05) */
  submit: protectedProcedure
    .input(z.object({
      productId: z.string(),
      orderId: z.string(),
      rating: z.number().int().min(1).max(5),
      title: z.string().optional(),
      body: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const customer = await ctx.db.customer.findUniqueOrThrow({ where: { userId } });
      // Verify purchase
      const orderItem = await ctx.db.orderItem.findFirst({
        where: { orderId: input.orderId, variant: { productId: input.productId } },
      });
      if (!orderItem) throw new Error("You can only review products you have purchased.");
      return ctx.db.review.create({
        data: {
          productId: input.productId,
          customerId: customer.id,
          orderId: input.orderId,
          rating: input.rating,
          title: input.title,
          body: input.body,
          isApproved: false, // pending moderation
        },
      });
    }),

  /** Admin moderation queue */
  getModerationQueue: adminProcedure
    .input(z.object({ page: z.number().default(1), pageSize: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const [total, items] = await Promise.all([
        ctx.db.review.count({ where: { isApproved: false } }),
        ctx.db.review.findMany({
          where: { isApproved: false },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          orderBy: { createdAt: "asc" },
          include: {
            product: { select: { name: true } },
            customer: { include: { user: { select: { name: true, email: true } } } },
          },
        }),
      ]);
      return { items, total, totalPages: Math.ceil(total / input.pageSize) };
    }),

  approve: adminProcedure.input(z.string()).mutation(({ ctx, input }) =>
    ctx.db.review.update({ where: { id: input }, data: { isApproved: true } })
  ),

  reject: adminProcedure.input(z.string()).mutation(({ ctx, input }) =>
    ctx.db.review.delete({ where: { id: input } })
  ),
});
