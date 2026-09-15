import { z } from "zod";
import { TRPCError } from "@trpc/server";
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

  /** Submit review — must have verified purchased order (FR-CUS-05) */
  submit: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        orderId: z.string(),
        rating: z.number().int().min(1).max(5),
        title: z.string().max(100).optional(),
        body: z.string().max(2000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const customer = await ctx.db.customer.upsert({
        where: { userId },
        create: { userId },
        update: {},
      });

      // Verify purchase ownership and delivery
      const order = await ctx.db.order.findUnique({
        where: { id: input.orderId },
        include: { items: { include: { variant: true } } },
      });

      if (!order || order.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Unauthorized: You can only review products purchased on your own account.",
        });
      }

      if (order.status !== "DELIVERED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Reviews can only be submitted for delivered orders.",
        });
      }

      const orderItem = order.items.find((item) => item.variant.productId === input.productId);
      if (!orderItem) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You can only review products that were part of this order.",
        });
      }

      const existingReview = await ctx.db.review.findFirst({
        where: { orderId: input.orderId, productId: input.productId },
      });
      if (existingReview) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You have already submitted a review for this product on this order.",
        });
      }

      return ctx.db.review.create({
        data: {
          productId: input.productId,
          customerId: customer.id,
          orderId: input.orderId,
          rating: input.rating,
          title: input.title?.trim(),
          body: input.body?.trim(),
          isApproved: false, // pending admin moderation
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
