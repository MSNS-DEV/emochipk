import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProcedure, branchManagerProcedure } from "@/server/trpc";
import type { Prisma, PrismaClient } from "@prisma/client";
import type { Session } from "next-auth";

/**
 * Enforces retail branch isolation for BRANCH_MANAGER role.
 * Admins retain global access across all branches.
 */
async function verifyBranchAccess(
  ctx: { db: PrismaClient; session: Session | null },
  targetBranchId: string
) {
  if (ctx.session?.user.role === "ADMIN") return;
  if (ctx.session?.user.role === "BRANCH_MANAGER") {
    const manager = await ctx.db.branchManager.findUnique({
      where: { userId: ctx.session.user.id },
    });
    if (!manager || manager.branchId !== targetBranchId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Access denied: You can only manage inventory for your assigned branch.",
      });
    }
    return manager;
  }
  throw new TRPCError({ code: "FORBIDDEN", message: "Unauthorized access." });
}

export const inventoryRouter = createTRPCRouter({
  /** Stock levels for a specific branch — branch isolated */
  getByBranch: branchManagerProcedure
    .input(
      z.object({
        branchId: z.string(),
        search: z.string().optional(),
        page: z.number().default(1),
        pageSize: z.number().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      await verifyBranchAccess(ctx, input.branchId);

      const where: Prisma.InventoryWhereInput = {
        branchId: input.branchId,
        ...(input.search && {
          variant: {
            OR: [
              { sku: { contains: input.search, mode: "insensitive" } },
              { product: { name: { contains: input.search, mode: "insensitive" } } },
            ],
          },
        }),
      };
      const [total, items] = await Promise.all([
        ctx.db.inventory.count({ where }),
        ctx.db.inventory.findMany({
          where,
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          include: {
            variant: {
              include: {
                product: {
                  include: { images: { where: { isPrimary: true }, take: 1 } },
                },
              },
            },
          },
          orderBy: { variant: { product: { name: "asc" } } },
        }),
      ]);
      return { items, total, totalPages: Math.ceil(total / input.pageSize) };
    }),

  /** Aggregate view across all branches — admin only */
  getAggregate: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        page: z.number().default(1),
        pageSize: z.number().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.InventoryWhereInput = {
        ...(input.search && {
          variant: {
            OR: [
              { sku: { contains: input.search, mode: "insensitive" } },
              { product: { name: { contains: input.search, mode: "insensitive" } } },
            ],
          },
        }),
      };
      const [total, items] = await Promise.all([
        ctx.db.inventory.count({ where }),
        ctx.db.inventory.findMany({
          where,
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          include: {
            branch: { select: { name: true, city: true } },
            variant: {
              select: {
                sku: true,
                color: true,
                colorHex: true,
                sizeUK: true,
                product: { select: { name: true, articleNumber: true } },
              },
            },
          },
        }),
      ]);
      return { items, total, totalPages: Math.ceil(total / input.pageSize) };
    }),

  /** Items below low-stock threshold */
  getLowStock: adminProcedure
    .input(z.object({ branchId: z.string().optional() }))
    .query(({ ctx, input }) =>
      ctx.db.inventory.findMany({
        where: {
          ...(input.branchId && { branchId: input.branchId }),
          quantity: { lte: ctx.db.inventory.fields.lowStockThreshold as never },
        },
        include: {
          branch: { select: { name: true, city: true } },
          variant: { include: { product: { select: { name: true, articleNumber: true } } } },
        },
        orderBy: { quantity: "asc" },
        take: 100,
      })
    ),

  /** Stock adjustment with reason (FR-BRN-06) — branch isolated */
  adjust: branchManagerProcedure
    .input(
      z.object({
        variantId: z.string(),
        branchId: z.string(),
        quantity: z.number().int(), // can be negative
        reason: z.string().min(1).max(100),
        notes: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyBranchAccess(ctx, input.branchId);
      const userId = ctx.session.user.id;

      return ctx.db.$transaction(async (tx) => {
        // Update inventory
        await tx.inventory.upsert({
          where: { branchId_variantId: { branchId: input.branchId, variantId: input.variantId } },
          create: {
            branchId: input.branchId,
            variantId: input.variantId,
            quantity: Math.max(0, input.quantity),
          },
          update: {
            quantity: { increment: input.quantity },
          },
        });
        // Log transaction
        await tx.inventoryTransaction.create({
          data: {
            variantId: input.variantId,
            branchId: input.branchId,
            quantity: input.quantity,
            type: "ADJUSTMENT",
            referenceId: "manual",
            userId,
          },
        });
        // Stock adjustment record
        return tx.stockAdjustment.create({
          data: {
            variantId: input.variantId,
            branchId: input.branchId,
            quantity: input.quantity,
            reason: input.reason,
            notes: input.notes,
            userId,
          },
        });
      });
    }),

  /** Transaction log (immutable audit trail) */
  getTransactionLog: adminProcedure
    .input(
      z.object({
        branchId: z.string().optional(),
        variantId: z.string().optional(),
        page: z.number().default(1),
        pageSize: z.number().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.InventoryTransactionWhereInput = {
        ...(input.branchId && { branchId: input.branchId }),
        ...(input.variantId && { variantId: input.variantId }),
      };
      const [total, items] = await Promise.all([
        ctx.db.inventoryTransaction.count({ where }),
        ctx.db.inventoryTransaction.findMany({
          where,
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          orderBy: { createdAt: "desc" },
          include: {
            variant: { include: { product: { select: { name: true } } } },
          },
        }),
      ]);
      return { items, total, totalPages: Math.ceil(total / input.pageSize) };
    }),

  // ─── Stock Transfers — Digital Handshake (FR-INV-09, FR-INV-10) ──────────

  /** Initiate a transfer from source to dest branch */
  initiateTransfer: branchManagerProcedure
    .input(
      z.object({
        sourceBranchId: z.string(),
        destBranchId: z.string(),
        transferDate: z.string(),
        reason: z.string().min(1).max(250),
        items: z.array(z.object({ variantId: z.string(), quantity: z.number().int().positive() })).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyBranchAccess(ctx, input.sourceBranchId);

      if (input.sourceBranchId === input.destBranchId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Source branch and destination branch must be different.",
        });
      }

      const userId = ctx.session.user.id;
      const transferNumber = `TRF-${Date.now()}`;

      // Aggregate items in case duplicate variantIds were supplied
      const itemMap = new Map<string, number>();
      for (const item of input.items) {
        itemMap.set(item.variantId, (itemMap.get(item.variantId) ?? 0) + item.quantity);
      }

      return ctx.db.$transaction(async (tx) => {
        // Verify inventory availability at source branch before deducting
        for (const [variantId, requiredQty] of itemMap.entries()) {
          const inv = await tx.inventory.findUnique({
            where: { branchId_variantId: { branchId: input.sourceBranchId, variantId } },
          });
          const available = inv ? inv.quantity - inv.reserved : 0;
          if (!inv || available < requiredQty) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Insufficient inventory at source branch for variant ${variantId}. Available: ${available}`,
            });
          }
        }

        const transfer = await tx.stockTransfer.create({
          data: {
            transferNumber,
            sourceBranchId: input.sourceBranchId,
            destBranchId: input.destBranchId,
            status: "PENDING",
            reason: input.reason,
            transferDate: new Date(input.transferDate),
            initiatedBy: userId,
            items: { create: Array.from(itemMap.entries()).map(([variantId, quantity]) => ({ variantId, quantity })) },
          },
          include: { items: true },
        });

        // Remove from source inventory
        for (const [variantId, qty] of itemMap.entries()) {
          await tx.inventory.update({
            where: { branchId_variantId: { branchId: input.sourceBranchId, variantId } },
            data: { quantity: { decrement: qty } },
          });
          await tx.inventoryTransaction.create({
            data: {
              variantId,
              branchId: input.sourceBranchId,
              quantity: -qty,
              type: "TRANSFER_OUT",
              referenceId: transfer.id,
              userId,
            },
          });
        }
        return transfer;
      });
    }),

  /** Confirm dispatch of a transfer */
  dispatchTransfer: branchManagerProcedure
    .input(z.object({ transferId: z.string(), trackingNumber: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const transfer = await ctx.db.stockTransfer.findUniqueOrThrow({
        where: { id: input.transferId },
      });
      await verifyBranchAccess(ctx, transfer.sourceBranchId);

      if (transfer.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Only PENDING transfers can be dispatched. Current status: ${transfer.status}`,
        });
      }

      return ctx.db.stockTransfer.update({
        where: { id: input.transferId },
        data: { status: "IN_TRANSIT", dispatchedAt: new Date(), trackingNumber: input.trackingNumber },
      });
    }),

  /** Destination branch confirms receipt */
  receiveTransfer: branchManagerProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: transferId }) => {
      const transfer = await ctx.db.stockTransfer.findUniqueOrThrow({
        where: { id: transferId },
        include: { items: true },
      });
      await verifyBranchAccess(ctx, transfer.destBranchId);

      if (transfer.status !== "IN_TRANSIT" && transfer.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Transfer cannot be received. Current status is ${transfer.status}.`,
        });
      }

      const userId = ctx.session.user.id;

      return ctx.db.$transaction(async (tx) => {
        const updateResult = await tx.stockTransfer.updateMany({
          where: { id: transferId, status: { in: ["IN_TRANSIT", "PENDING"] } },
          data: { status: "RECEIVED", receivedAt: new Date() },
        });

        if (updateResult.count === 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Transfer has already been processed or status changed concurrently.",
          });
        }

        for (const item of transfer.items) {
          await tx.inventory.upsert({
            where: { branchId_variantId: { branchId: transfer.destBranchId, variantId: item.variantId } },
            create: { branchId: transfer.destBranchId, variantId: item.variantId, quantity: item.quantity },
            update: { quantity: { increment: item.quantity } },
          });
          await tx.inventoryTransaction.create({
            data: {
              variantId: item.variantId,
              branchId: transfer.destBranchId,
              quantity: item.quantity,
              type: "TRANSFER_IN",
              referenceId: transferId,
              userId,
            },
          });
        }
        return tx.stockTransfer.findUniqueOrThrow({
          where: { id: transferId },
          include: { items: true },
        });
      });
    }),

  /** Destination branch rejects transfer — stock returns to source */
  rejectTransfer: branchManagerProcedure
    .input(z.object({ transferId: z.string(), reason: z.string().min(1).max(250) }))
    .mutation(async ({ ctx, input }) => {
      const transfer = await ctx.db.stockTransfer.findUniqueOrThrow({
        where: { id: input.transferId },
        include: { items: true },
      });
      await verifyBranchAccess(ctx, transfer.destBranchId);

      if (transfer.status !== "IN_TRANSIT" && transfer.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Transfer cannot be rejected. Current status is ${transfer.status}.`,
        });
      }

      const userId = ctx.session.user.id;

      return ctx.db.$transaction(async (tx) => {
        const updateResult = await tx.stockTransfer.updateMany({
          where: { id: input.transferId, status: { in: ["IN_TRANSIT", "PENDING"] } },
          data: { status: "REJECTED" },
        });

        if (updateResult.count === 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Transfer has already been processed or status changed concurrently.",
          });
        }

        // Return stock to source
        for (const item of transfer.items) {
          await tx.inventory.update({
            where: { branchId_variantId: { branchId: transfer.sourceBranchId, variantId: item.variantId } },
            data: { quantity: { increment: item.quantity } },
          });
          await tx.inventoryTransaction.create({
            data: {
              variantId: item.variantId,
              branchId: transfer.sourceBranchId,
              quantity: item.quantity,
              type: "ADJUSTMENT",
              referenceId: input.transferId,
              userId,
            },
          });
        }
        return tx.stockTransfer.findUniqueOrThrow({
          where: { id: input.transferId },
          include: { items: true },
        });
      });
    }),

  /** List transfers for a branch — branch isolated */
  getTransfers: branchManagerProcedure
    .input(
      z.object({
        branchId: z.string(),
        status: z.enum(["PENDING", "IN_TRANSIT", "RECEIVED", "REJECTED"]).optional(),
        page: z.number().default(1),
        pageSize: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      await verifyBranchAccess(ctx, input.branchId);

      const where: Prisma.StockTransferWhereInput = {
        OR: [{ sourceBranchId: input.branchId }, { destBranchId: input.branchId }],
        ...(input.status && { status: input.status }),
      };
      const [total, items] = await Promise.all([
        ctx.db.stockTransfer.count({ where }),
        ctx.db.stockTransfer.findMany({
          where,
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          orderBy: { createdAt: "desc" },
          include: {
            sourceBranch: { select: { name: true, city: true } },
            destBranch: { select: { name: true, city: true } },
            items: { include: { transfer: false } },
          },
        }),
      ]);
      return { items, total, totalPages: Math.ceil(total / input.pageSize) };
    }),
});
