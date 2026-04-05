import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure, branchManagerProcedure } from "@/server/trpc";
import type { Prisma } from "@prisma/client";

export const returnsRouter = createTRPCRouter({
  /** Customer initiates a return (FR-EXC-02, FR-EXC-03) */
  initiate: protectedProcedure
    .input(z.object({
      orderId: z.string(),
      reason: z.enum(["SIZE_DOES_NOT_FIT", "DAMAGED", "WRONG_PRODUCT", "CHANGED_MIND", "QUALITY_ISSUE"]),
      resolution: z.enum(["EXCHANGE_SIZE", "EXCHANGE_PRODUCT", "STORE_CREDIT", "REFUND"]),
      notes: z.string().optional(),
      items: z.array(z.object({ variantId: z.string(), quantity: z.number().int().positive() })),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const customer = await ctx.db.customer.findUniqueOrThrow({ where: { userId } });
      const returnNumber = `RET-${Date.now().toString(36).toUpperCase()}`;
      return ctx.db.returnRequest.create({
        data: {
          returnNumber,
          orderId: input.orderId,
          customerId: customer.id,
          userId,
          status: "PENDING",
          reason: input.reason,
          resolution: input.resolution,
          notes: input.notes,
          items: { create: input.items },
        },
        include: { items: true },
      });
    }),

  /** Queue for admin/branch managers */
  getQueue: branchManagerProcedure
    .input(z.object({
      status: z.string().optional(),
      page: z.number().default(1),
      pageSize: z.number().default(20),
    }))
    .query(async ({ ctx, input }) => {
      const where: Prisma.ReturnRequestWhereInput = {
        ...(input.status && { status: input.status as never }),
      };
      const [total, items] = await Promise.all([
        ctx.db.returnRequest.count({ where }),
        ctx.db.returnRequest.findMany({
          where,
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          orderBy: { createdAt: "desc" },
          include: {
            order: { select: { orderNumber: true } },
            customer: { include: { user: { select: { name: true, email: true } } } },
            items: true,
          },
        }),
      ]);
      return { items, total, totalPages: Math.ceil(total / input.pageSize) };
    }),

  /** Customer's own return requests */
  getMyReturns: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return ctx.db.returnRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { order: { select: { orderNumber: true } }, items: true },
    });
  }),

  approve: adminProcedure
    .input(z.object({ returnId: z.string(), notes: z.string().optional() }))
    .mutation(({ ctx, input }) =>
      ctx.db.returnRequest.update({
        where: { id: input.returnId },
        data: { status: "APPROVED" },
      })
    ),

  reject: adminProcedure
    .input(z.object({ returnId: z.string(), reason: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.db.returnRequest.update({
        where: { id: input.returnId },
        data: { status: "REJECTED", notes: input.reason },
      })
    ),

  markReceived: branchManagerProcedure.input(z.string()).mutation(({ ctx, input }) =>
    ctx.db.returnRequest.update({ where: { id: input }, data: { status: "RECEIVED" } })
  ),

  /** Complete return — issue store credit if resolution = STORE_CREDIT */
  complete: branchManagerProcedure
    .input(z.object({
      returnId: z.string(),
      issueStoreCredit: z.boolean().default(false),
      creditAmount: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const ret = await ctx.db.returnRequest.update({
        where: { id: input.returnId },
        data: { status: "COMPLETED" },
      });
      if (input.issueStoreCredit && input.creditAmount) {
        const voucherCode = `SC-${Date.now().toString(36).toUpperCase()}`;
        await ctx.db.storeCredit.create({
          data: {
            customerId: ret.customerId,
            returnRequestId: ret.id,
            voucherCode,
            amount: input.creditAmount,
            remaining: input.creditAmount,
            issuedFrom: ret.returnNumber,
            expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
          },
        });
      }
      return ret;
    }),
});
