import { z } from "zod";
import { createTRPCRouter, adminProcedure, branchManagerProcedure } from "@/server/trpc";
import type { Prisma } from "@prisma/client";

export const inventoryRouter = createTRPCRouter({
  /** Stock levels for a specific branch — used by branch portal */
  getByBranch: branchManagerProcedure
    .input(z.object({
      branchId: z.string(),
      search: z.string().optional(),
      page: z.number().default(1),
      pageSize: z.number().default(50),
    }))
    .query(async ({ ctx, input }) => {
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

  /** Aggregate view across all branches — admin */
  getAggregate: adminProcedure
    .input(z.object({
      search: z.string().optional(),
      page: z.number().default(1),
      pageSize: z.number().default(50),
    }))
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

  /** Stock adjustment with reason (FR-BRN-06) */
  adjust: branchManagerProcedure
    .input(z.object({
      variantId: z.string(),
      branchId: z.string(),
      quantity: z.number().int(), // can be negative
      reason: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
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
    .input(z.object({
      branchId: z.string().optional(),
      variantId: z.string().optional(),
      page: z.number().default(1),
      pageSize: z.number().default(50),
    }))
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
    .input(z.object({
      sourceBranchId: z.string(),
      destBranchId: z.string(),
      transferDate: z.string(),
      reason: z.string(),
      items: z.array(z.object({ variantId: z.string(), quantity: z.number().int().positive() })),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const transferNumber = `TRF-${Date.now()}`;
      return ctx.db.$transaction(async (tx) => {
        const transfer = await tx.stockTransfer.create({
          data: {
            transferNumber,
            sourceBranchId: input.sourceBranchId,
            destBranchId: input.destBranchId,
            status: "PENDING",
            reason: input.reason,
            transferDate: new Date(input.transferDate),
            initiatedBy: userId,
            items: { create: input.items },
          },
          include: { items: true },
        });
        // Remove from source inventory
        for (const item of input.items) {
          await tx.inventory.update({
            where: { branchId_variantId: { branchId: input.sourceBranchId, variantId: item.variantId } },
            data: { quantity: { decrement: item.quantity } },
          });
          await tx.inventoryTransaction.create({
            data: {
              variantId: item.variantId,
              branchId: input.sourceBranchId,
              quantity: -item.quantity,
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
    .mutation(({ ctx, input }) =>
      ctx.db.stockTransfer.update({
        where: { id: input.transferId },
        data: { status: "IN_TRANSIT", dispatchedAt: new Date(), trackingNumber: input.trackingNumber },
      })
    ),

  /** Destination branch confirms receipt */
  receiveTransfer: branchManagerProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: transferId }) => {
      const userId = ctx.session.user.id;
      return ctx.db.$transaction(async (tx) => {
        const transfer = await tx.stockTransfer.update({
          where: { id: transferId },
          data: { status: "RECEIVED", receivedAt: new Date() },
          include: { items: true },
        });
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
        return transfer;
      });
    }),

  /** Destination branch rejects transfer — stock returns to source */
  rejectTransfer: branchManagerProcedure
    .input(z.object({ transferId: z.string(), reason: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      return ctx.db.$transaction(async (tx) => {
        const transfer = await tx.stockTransfer.update({
          where: { id: input.transferId },
          data: { status: "REJECTED" },
          include: { items: true },
        });
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
        return transfer;
      });
    }),

  /** List transfers for a branch */
  getTransfers: branchManagerProcedure
    .input(z.object({
      branchId: z.string(),
      status: z.enum(["PENDING", "IN_TRANSIT", "RECEIVED", "REJECTED"]).optional(),
      page: z.number().default(1),
      pageSize: z.number().default(20),
    }))
    .query(async ({ ctx, input }) => {
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
