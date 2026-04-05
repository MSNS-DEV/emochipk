import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure, adminProcedure, branchManagerProcedure } from "@/server/trpc";
import type { Prisma } from "@prisma/client";

const ShippingAddressSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().min(10),
  street: z.string().min(1),
  city: z.string().min(1),
  province: z.string().min(1),
  postalCode: z.string().optional(),
  country: z.string().default("Pakistan"),
});

const OrderCreateSchema = z.object({
  branchId: z.string(),
  paymentMethod: z.enum(["COD", "RAAST", "JAZZCASH", "EASYPAISA", "CARD", "STORE_CREDIT", "LOYALTY_POINTS"]),
  shippingAddress: ShippingAddressSchema,
  notes: z.string().optional(),
  discountAmount: z.number().default(0),
  shippingCost: z.number().default(250),
  items: z.array(z.object({ variantId: z.string(), quantity: z.number().int().positive() })),
});

export const orderRouter = createTRPCRouter({
  /** Place a new order — atomic transaction (FR-ORD-06, NFR-REL-03) */
  create: protectedProcedure.input(OrderCreateSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;

    return ctx.db.$transaction(async (tx) => {
      // 1. Get all variants with current prices
      const variants = await tx.productVariant.findMany({
        where: { id: { in: input.items.map((i) => i.variantId) } },
        include: { product: true, inventory: { where: { branchId: input.branchId } } },
      });

      // 2. Check inventory availability
      for (const item of input.items) {
        const variant = variants.find((v) => v.id === item.variantId);
        if (!variant) throw new Error(`Variant ${item.variantId} not found`);
        const inv = variant.inventory[0];
        const available = (inv?.quantity ?? 0) - (inv?.reserved ?? 0);
        if (available < item.quantity) throw new Error(`Insufficient stock for ${variant.sku}`);
      }

      // 3. Calculate totals
      let subtotal = 0;
      const orderItems = input.items.map((item) => {
        const variant = variants.find((v) => v.id === item.variantId)!;
        const unitPrice = Number(variant.product.salePrice ?? variant.product.basePrice) + Number(variant.priceDelta);
        const itemTotal = unitPrice * item.quantity;
        subtotal += itemTotal;
        return { variantId: item.variantId, quantity: item.quantity, unitPrice, subtotal: itemTotal };
      });
      const totalAmount = subtotal - input.discountAmount + input.shippingCost;

      // 4. Generate order number
      const orderNumber = `EM-${Date.now().toString(36).toUpperCase()}`;

      // 5. Create order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          branchId: input.branchId,
          status: input.paymentMethod === "COD" ? "PENDING_VERIFICATION" : "PENDING",
          paymentMethod: input.paymentMethod,
          paymentStatus: input.paymentMethod === "COD" ? "COD_PENDING_COLLECTION" : "UNPAID",
          totalAmount,
          shippingCost: input.shippingCost,
          discountAmount: input.discountAmount,
          notes: input.notes,
          items: { create: orderItems },
          shippingAddress: { create: input.shippingAddress },
        },
        include: { items: true, shippingAddress: true },
      });

      // 6. Decrement inventory (reserve for COD, hard deduct for digital)
      for (const item of input.items) {
        if (input.paymentMethod === "COD") {
          await tx.inventory.update({
            where: { branchId_variantId: { branchId: input.branchId, variantId: item.variantId } },
            data: { reserved: { increment: item.quantity } },
          });
        } else {
          await tx.inventory.update({
            where: { branchId_variantId: { branchId: input.branchId, variantId: item.variantId } },
            data: { quantity: { decrement: item.quantity } },
          });
        }
        await tx.inventoryTransaction.create({
          data: {
            variantId: item.variantId,
            branchId: input.branchId,
            quantity: -item.quantity,
            type: "SALE",
            referenceId: order.id,
            userId,
          },
        });
      }

      // 7. If customer exists, link order to customer profile
      const customerProfile = await tx.customer.findUnique({ where: { userId } });
      if (customerProfile) {
        await tx.order.update({
          where: { id: order.id },
          data: { customerId: customerProfile.id },
        });
      }

      return order;
    });
  }),

  /** Customer's own orders */
  getMyOrders: protectedProcedure
    .input(z.object({ page: z.number().default(1), pageSize: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const [total, items] = await Promise.all([
        ctx.db.order.count({ where: { userId } }),
        ctx.db.order.findMany({
          where: { userId },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          orderBy: { createdAt: "desc" },
          include: {
            items: {
              include: {
                variant: { include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } } } },
              },
            },
            shippingAddress: true,
            branch: { select: { name: true, city: true } },
          },
        }),
      ]);
      return { items, total, totalPages: Math.ceil(total / input.pageSize) };
    }),

  /** Admin / Branch Manager — all orders */
  getAll: branchManagerProcedure
    .input(z.object({
      branchId: z.string().optional(),
      status: z.string().optional(),
      page: z.number().default(1),
      pageSize: z.number().default(20),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: Prisma.OrderWhereInput = {
        ...(input.branchId && { branchId: input.branchId }),
        ...(input.status && { status: input.status as never }),
        ...(input.search && {
          OR: [
            { orderNumber: { contains: input.search, mode: "insensitive" } },
            { user: { name: { contains: input.search, mode: "insensitive" } } },
          ],
        }),
      };
      const [total, items] = await Promise.all([
        ctx.db.order.count({ where }),
        ctx.db.order.findMany({
          where,
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { name: true, email: true, phone: true } },
            branch: { select: { name: true, city: true } },
            items: { include: { variant: { include: { product: { select: { name: true } } } } } },
            shippingAddress: true,
          },
        }),
      ]);
      return { items, total, totalPages: Math.ceil(total / input.pageSize) };
    }),

  /** Full order detail */
  getById: protectedProcedure.input(z.string()).query(({ ctx, input }) =>
    ctx.db.order.findUnique({
      where: { id: input },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        branch: true,
        items: {
          include: {
            variant: {
              include: {
                product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
              },
            },
          },
        },
        shippingAddress: true,
        returnRequests: true,
      },
    })
  ),

  /** Update order status (branch manager / admin) */
  updateStatus: branchManagerProcedure
    .input(z.object({
      orderId: z.string(),
      status: z.enum(["PENDING", "PENDING_VERIFICATION", "VERIFIED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "CANCELLED_VERIFICATION_FAILED", "RTO", "RETURNED"]),
      awbNumber: z.string().optional(),
      courierService: z.enum(["LEOPARDS", "POSTEX", "TRAX", "PAKISTAN_POST"]).optional(),
      trackingNumber: z.string().optional(),
    }))
    .mutation(({ ctx, input }) => {
      const { orderId, status, ...data } = input;
      return ctx.db.order.update({
        where: { id: orderId },
        data: { status, ...data },
      });
    }),

  /** Cancel order — release reserved inventory */
  cancel: protectedProcedure
    .input(z.object({ orderId: z.string(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      return ctx.db.$transaction(async (tx) => {
        const order = await tx.order.findUniqueOrThrow({
          where: { id: input.orderId },
          include: { items: true },
        });

        if (order.userId !== userId && ctx.session.user.role === "CUSTOMER") {
          throw new Error("Unauthorized");
        }

        await tx.order.update({
          where: { id: input.orderId },
          data: { status: "CANCELLED", notes: input.reason },
        });

        // Release reserved inventory
        for (const item of order.items) {
          await tx.inventory.update({
            where: { branchId_variantId: { branchId: order.branchId, variantId: item.variantId } },
            data: {
              reserved: { decrement: item.quantity },
              quantity: { increment: item.quantity },
            },
          });
        }
        return { success: true };
      });
    }),

  /** Public tracking — by order number (FR-ORD-20) */
  track: publicProcedure.input(z.string()).query(({ ctx, input }) =>
    ctx.db.order.findFirst({
      where: { orderNumber: input },
      select: {
        orderNumber: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        trackingNumber: true,
        courierService: true,
        shippingAddress: { select: { city: true, province: true } },
        items: {
          select: {
            quantity: true,
            variant: { select: { product: { select: { name: true } } } },
          },
        },
      },
    })
  ),

  /** Stats for admin dashboard */
  getStats: adminProcedure.query(async ({ ctx }) => {
    const [total, pending, processing, delivered, revenue] = await Promise.all([
      ctx.db.order.count(),
      ctx.db.order.count({ where: { status: "PENDING_VERIFICATION" } }),
      ctx.db.order.count({ where: { status: { in: ["PROCESSING", "PACKED", "SHIPPED"] } } }),
      ctx.db.order.count({ where: { status: "DELIVERED" } }),
      ctx.db.order.aggregate({ _sum: { totalAmount: true }, where: { status: "DELIVERED" } }),
    ]);
    return { total, pending, processing, delivered, revenue: revenue._sum.totalAmount };
  }),
});
