import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, adminProcedure, branchManagerProcedure } from "@/server/trpc";
import type { Prisma } from "@prisma/client";

export const returnsRouter = createTRPCRouter({
  /** Customer initiates a return (FR-EXC-02, FR-EXC-03) — ownership & delivery verified */
  initiate: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        reason: z.enum(["SIZE_DOES_NOT_FIT", "DAMAGED", "WRONG_PRODUCT", "CHANGED_MIND", "QUALITY_ISSUE"]),
        resolution: z.enum(["EXCHANGE_SIZE", "EXCHANGE_PRODUCT", "STORE_CREDIT", "REFUND"]),
        notes: z.string().max(500).optional(),
        items: z
          .array(z.object({ variantId: z.string(), quantity: z.number().int().positive().max(20) }))
          .min(1, "At least one item required for return"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const customer = await ctx.db.customer.upsert({
        where: { userId },
        create: { userId },
        update: {},
      });

      // Prevent duplicate active return requests on the same order
      const existingActiveReturn = await ctx.db.returnRequest.findFirst({
        where: {
          orderId: input.orderId,
          status: { in: ["PENDING", "APPROVED", "RECEIVED", "INSPECTING"] },
        },
      });

      if (existingActiveReturn) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `A return request (${existingActiveReturn.returnNumber}) is already active for this order.`,
        });
      }

      // Verify order ownership
      const order = await ctx.db.order.findUnique({
        where: { id: input.orderId },
        include: { items: true },
      });

      if (!order || order.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Order not found or does not belong to your account.",
        });
      }

      if (order.status !== "DELIVERED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Returns can only be initiated for orders that have been successfully delivered.",
        });
      }

      // Verify return item eligibility against order items
      for (const reqItem of input.items) {
        const orderItem = order.items.find((i) => i.variantId === reqItem.variantId);
        if (!orderItem || reqItem.quantity > orderItem.quantity) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "One or more return items were not part of this order or exceed purchased quantity.",
          });
        }
      }

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
    .input(
      z.object({
        status: z.string().optional(),
        page: z.number().default(1),
        pageSize: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      let branchFilter: string | undefined;
      if (ctx.session.user.role === "BRANCH_MANAGER") {
        const manager = await ctx.db.branchManager.findUnique({
          where: { userId: ctx.session.user.id },
        });
        if (!manager) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "No assigned retail branch found for this account.",
          });
        }
        branchFilter = manager.branchId;
      }

      const where: Prisma.ReturnRequestWhereInput = {
        ...(input.status && { status: input.status as never }),
        ...(branchFilter && { order: { branchId: branchFilter } }),
      };
      const [total, items] = await Promise.all([
        ctx.db.returnRequest.count({ where }),
        ctx.db.returnRequest.findMany({
          where,
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          orderBy: { createdAt: "desc" },
          include: {
            order: { select: { orderNumber: true, branchId: true } },
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
    .input(z.object({ returnId: z.string(), notes: z.string().max(500).optional() }))
    .mutation(async ({ ctx, input }) => {
      const ret = await ctx.db.returnRequest.findUniqueOrThrow({
        where: { id: input.returnId },
      });
      if (ret.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Return cannot be approved from ${ret.status} status.`,
        });
      }
      return ctx.db.returnRequest.update({
        where: { id: input.returnId },
        data: { status: "APPROVED", notes: input.notes },
      });
    }),

  reject: adminProcedure
    .input(z.object({ returnId: z.string(), reason: z.string().min(1).max(500) }))
    .mutation(async ({ ctx, input }) => {
      const ret = await ctx.db.returnRequest.findUniqueOrThrow({
        where: { id: input.returnId },
      });
      if (ret.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Return cannot be rejected from ${ret.status} status.`,
        });
      }
      return ctx.db.returnRequest.update({
        where: { id: input.returnId },
        data: { status: "REJECTED", notes: input.reason },
      });
    }),

  markReceived: branchManagerProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    const ret = await ctx.db.returnRequest.findUniqueOrThrow({
      where: { id: input },
      include: { order: true },
    });

    if (ctx.session.user.role === "BRANCH_MANAGER") {
      const manager = await ctx.db.branchManager.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!manager || manager.branchId !== ret.order.branchId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Branch managers can only process returns for their assigned branch.",
        });
      }
    }

    if (ret.status !== "APPROVED" && ret.status !== "RETURN_SHIPPED") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Cannot mark return as received from ${ret.status} status. Return must be approved or shipped.`,
      });
    }

    return ctx.db.returnRequest.update({
      where: { id: input },
      data: { status: "RECEIVED" },
    });
  }),

  /** Complete return — issue store credit if resolution = STORE_CREDIT */
  complete: branchManagerProcedure
    .input(
      z.object({
        returnId: z.string(),
        issueStoreCredit: z.boolean().default(false),
        creditAmount: z.number().nonnegative().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ret = await ctx.db.returnRequest.findUniqueOrThrow({
        where: { id: input.returnId },
        include: { order: true },
      });

      if (ctx.session.user.role === "BRANCH_MANAGER") {
        const manager = await ctx.db.branchManager.findUnique({
          where: { userId: ctx.session.user.id },
        });
        if (!manager || manager.branchId !== ret.order.branchId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Branch managers can only complete returns for their assigned branch.",
          });
        }
      }

      if (ret.status !== "RECEIVED" && ret.status !== "INSPECTING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot complete return in ${ret.status} status. Return must be received or inspecting first.`,
        });
      }

      return ctx.db.$transaction(async (tx) => {
        const updated = await tx.returnRequest.update({
          where: { id: input.returnId },
          data: { status: "COMPLETED" },
        });

        if (input.issueStoreCredit && input.creditAmount && input.creditAmount > 0) {
          // Check idempotency: ensure no store credit already exists for this return
          const existingCredit = await tx.storeCredit.findUnique({
            where: { returnRequestId: ret.id },
          });

          if (!existingCredit) {
            // Enforce credit amount cap at order total
            const maxCredit = Number(ret.order.totalAmount);
            const safeCredit = Math.min(input.creditAmount, maxCredit);

            const voucherCode = `SC-${Date.now().toString(36).toUpperCase()}`;
            await tx.storeCredit.create({
              data: {
                customerId: ret.customerId,
                returnRequestId: ret.id,
                voucherCode,
                amount: safeCredit,
                remaining: safeCredit,
                issuedFrom: ret.returnNumber,
                expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
              },
            });
          }
        }
        return updated;
      });
    }),
});
