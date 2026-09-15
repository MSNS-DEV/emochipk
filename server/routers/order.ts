import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
  branchManagerProcedure,
} from "@/server/trpc";
import type { Prisma } from "@prisma/client";
import { sendMetaEvents, buildUserData, nowSeconds } from "@/lib/meta-capi";

const ShippingAddressSchema = z.object({
  fullName: z.string().min(1).max(100),
  phone: z.string().min(10).max(20),
  street: z.string().min(1).max(250),
  city: z.string().min(1).max(100),
  province: z.string().min(1).max(100),
  postalCode: z.string().max(20).optional(),
  country: z.string().default("Pakistan"),
});

const OrderCreateSchema = z.object({
  branchId: z.string(),
  paymentMethod: z.enum([
    "COD",
    "RAAST",
    "JAZZCASH",
    "EASYPAISA",
    "CARD",
    "STORE_CREDIT",
    "LOYALTY_POINTS",
  ]),
  shippingAddress: ShippingAddressSchema,
  notes: z.string().max(500).optional(),
  couponCode: z.string().trim().max(30).optional(),
  discountAmount: z.number().nonnegative().default(0),
  shippingCost: z.number().nonnegative().optional(),
  items: z
    .array(
      z.object({
        variantId: z.string(),
        quantity: z.number().int().positive().max(50),
      })
    )
    .min(1, "Order must contain at least one item"),
  // Meta CAPI enrichment fields (sent from browser, not stored)
  fbp: z.string().optional(),
  fbc: z.string().optional(),
  clientIp: z.string().optional(),
  clientUserAgent: z.string().optional(),
  eventSourceUrl: z.string().optional(),
});

const VALID_COUPONS: Record<string, { type: "percent" | "fixed"; value: number }> = {
  WELCOME10: { type: "percent", value: 0.10 },
  MOCHI20: { type: "percent", value: 0.20 },
  EID500: { type: "fixed", value: 500 },
};

export const orderRouter = createTRPCRouter({
  /** Place a new order — atomic transaction (FR-ORD-06, NFR-REL-03) */
  create: protectedProcedure.input(OrderCreateSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;

    // Aggregate items in case client submits duplicate variant IDs
    const itemMap = new Map<string, number>();
    for (const item of input.items) {
      itemMap.set(item.variantId, (itemMap.get(item.variantId) ?? 0) + item.quantity);
    }
    const uniqueVariantIds = Array.from(itemMap.keys());

    // ── Step 1: run the DB transaction ──────────────────────────────────
    const order = await ctx.db.$transaction(async (tx) => {
      // 1. Get all variants with current prices and inventory for requested branch
      const variants = await tx.productVariant.findMany({
        where: { id: { in: uniqueVariantIds } },
        include: { product: true, inventory: { where: { branchId: input.branchId } } },
      });

      // 2. Check inventory availability against aggregated quantities
      for (const [variantId, qty] of itemMap.entries()) {
        const variant = variants.find((v) => v.id === variantId);
        if (!variant) throw new TRPCError({ code: "NOT_FOUND", message: `Variant ${variantId} not found` });
        const inv = variant.inventory[0];
        if (!inv) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Variant ${variant.sku} is not in stock at selected branch.`,
          });
        }
        const available = inv.quantity - inv.reserved;
        if (available < qty) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Insufficient stock for ${variant.sku}. Available: ${available}`,
          });
        }
      }

      // 3. Calculate subtotal & enforce server-side pricing integrity
      let subtotal = 0;
      const orderItems = Array.from(itemMap.entries()).map(([variantId, quantity]) => {
        const variant = variants.find((v) => v.id === variantId)!;
        const unitPrice =
          Number(variant.product.salePrice ?? variant.product.basePrice) +
          Number(variant.priceDelta);
        const itemTotal = unitPrice * quantity;
        subtotal += itemTotal;
        return { variantId, quantity, unitPrice, subtotal: itemTotal };
      });

      // Server-side coupon verification: prevents arbitrary client discount injection
      let verifiedDiscount = 0;
      if (input.couponCode) {
        const code = input.couponCode.trim().toUpperCase();
        const promo = VALID_COUPONS[code];
        if (!promo) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid coupon code." });
        }
        verifiedDiscount =
          promo.type === "percent"
            ? Math.round(subtotal * promo.value)
            : Math.min(promo.value, subtotal);
      }

      // If no valid coupon was provided, discount must be 0
      const safeDiscount = input.couponCode
        ? Math.min(input.discountAmount > 0 ? input.discountAmount : verifiedDiscount, verifiedDiscount)
        : 0;

      // Standard shipping rule: Free shipping for orders >= 5,000 PKR, else 250 PKR
      const shippingCost = subtotal >= 5000 ? 0 : 250;
      const totalAmount = Math.max(0, subtotal - safeDiscount + shippingCost);

      // 4. Generate order number
      const orderNumber = `EM-${Date.now().toString(36).toUpperCase()}`;

      // 5. Create order
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          branchId: input.branchId,
          status: input.paymentMethod === "COD" ? "PENDING_VERIFICATION" : "PENDING",
          paymentMethod: input.paymentMethod,
          paymentStatus: input.paymentMethod === "COD" ? "COD_PENDING_COLLECTION" : "UNPAID",
          totalAmount,
          shippingCost,
          discountAmount: safeDiscount,
          notes: input.notes,
          items: { create: orderItems },
          shippingAddress: { create: input.shippingAddress },
        },
        include: {
          items: { include: { variant: { include: { product: true } } } },
          shippingAddress: true,
        },
      });

      // 6. Decrement / reserve inventory for aggregated quantities
      for (const [variantId, qty] of itemMap.entries()) {
        if (input.paymentMethod === "COD") {
          await tx.inventory.update({
            where: { branchId_variantId: { branchId: input.branchId, variantId } },
            data: { reserved: { increment: qty } },
          });
        } else {
          await tx.inventory.update({
            where: { branchId_variantId: { branchId: input.branchId, variantId } },
            data: { quantity: { decrement: qty } },
          });
        }
        await tx.inventoryTransaction.create({
          data: {
            variantId,
            branchId: input.branchId,
            quantity: -qty,
            type: "SALE",
            referenceId: createdOrder.id,
            userId,
          },
        });
      }


      // 7. Link to customer profile if exists
      const customerProfile = await tx.customer.findUnique({ where: { userId } });
      if (customerProfile) {
        await tx.order.update({
          where: { id: createdOrder.id },
          data: { customerId: customerProfile.id },
        });
      }

      return createdOrder;
    });

    // ── Step 2: fire Meta CAPI Purchase event OUTSIDE the transaction ────
    const addr = order.shippingAddress as {
      fullName?: string;
      phone?: string;
      city?: string;
      province?: string;
      postalCode?: string;
    } | null;
    const [firstName, ...rest] = (addr?.fullName ?? "").split(" ");
    const lastName = rest.join(" ");

    const contents = (order.items as any[]).map((item: any) => ({
      id: item.variant?.product?.articleNumber ?? item.variantId,
      quantity: item.quantity,
      item_price: Number(item.unitPrice),
    }));

    void sendMetaEvents([
      {
        event_name: "Purchase",
        event_time: nowSeconds(),
        event_id: `purchase-${order.id}`,
        event_source_url: input.eventSourceUrl ?? "https://executivemochi.pk/checkout",
        action_source: "website",
        user_data: buildUserData({
          email: ctx.session.user.email,
          phone: addr?.phone,
          firstName,
          lastName,
          city: addr?.city,
          state: addr?.province,
          postalCode: addr?.postalCode,
          country: "pk",
          userId,
          ip: input.clientIp,
          ua: input.clientUserAgent,
          fbp: input.fbp,
          fbc: input.fbc,
        }),
        custom_data: {
          order_id: order.orderNumber,
          currency: "PKR",
          value: Number(order.totalAmount),
          num_items: order.items.length,
          content_type: "product",
          contents,
          content_ids: contents.map((c: { id: string }) => c.id),
        },
      },
    ]);

    return order;
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
                variant: {
                  include: {
                    product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
                  },
                },
              },
            },
            shippingAddress: true,
            branch: { select: { name: true, city: true } },
          },
        }),
      ]);
      return { items, total, totalPages: Math.ceil(total / input.pageSize) };
    }),

  /** Admin / Branch Manager — all orders (branch-isolated for branch managers) */
  getAll: branchManagerProcedure
    .input(
      z.object({
        branchId: z.string().optional(),
        status: z.string().optional(),
        page: z.number().default(1),
        pageSize: z.number().default(20),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      let branchFilter = input.branchId;

      // Enforce branch isolation for branch managers
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

      const where: Prisma.OrderWhereInput = {
        ...(branchFilter && { branchId: branchFilter }),
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

  /** Full order detail (IDOR-protected) */
  getById: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const order = await ctx.db.order.findUnique({
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
    });

    if (!order) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Order not found." });
    }

    // Role-based authorization & IDOR prevention
    if (ctx.session.user.role === "CUSTOMER") {
      if (order.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
      }
    } else if (ctx.session.user.role === "BRANCH_MANAGER") {
      const manager = await ctx.db.branchManager.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!manager || manager.branchId !== order.branchId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied: Order belongs to a different branch.",
        });
      }
    }

    return order;
  }),

  /** Update order status (branch manager / admin) */
  updateStatus: branchManagerProcedure
    .input(
      z.object({
        orderId: z.string(),
        status: z.enum([
          "PENDING",
          "PENDING_VERIFICATION",
          "VERIFIED",
          "PROCESSING",
          "PACKED",
          "SHIPPED",
          "OUT_FOR_DELIVERY",
          "DELIVERED",
          "CANCELLED",
          "CANCELLED_VERIFICATION_FAILED",
          "RTO",
          "RETURNED",
        ]),
        awbNumber: z.string().optional(),
        courierService: z.enum(["LEOPARDS", "POSTEX", "TRAX", "PAKISTAN_POST", "TCS"]).optional(),
        trackingNumber: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.order.findUniqueOrThrow({
        where: { id: input.orderId },
      });

      if (ctx.session.user.role === "BRANCH_MANAGER") {
        const manager = await ctx.db.branchManager.findUnique({
          where: { userId: ctx.session.user.id },
        });
        if (!manager || manager.branchId !== order.branchId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Branch managers cannot update orders outside their assigned branch.",
          });
        }
      }

      const { orderId, status, ...data } = input;
      return ctx.db.order.update({
        where: { id: orderId },
        data: { status, ...data },
      });
    }),

  /** Cancel order — release reserved inventory safely */
  cancel: protectedProcedure
    .input(z.object({ orderId: z.string(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      return ctx.db.$transaction(async (tx) => {
        const order = await tx.order.findUniqueOrThrow({
          where: { id: input.orderId },
          include: { items: true },
        });

        if (ctx.session.user.role === "CUSTOMER") {
          if (order.userId !== userId) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Unauthorized." });
          }
          // Customers can only cancel PENDING or PENDING_VERIFICATION orders
          if (
            order.status !== "PENDING" &&
            order.status !== "PENDING_VERIFICATION"
          ) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Orders in ${order.status} state cannot be cancelled online. Please contact support.`,
            });
          }
        } else if (ctx.session.user.role === "BRANCH_MANAGER") {
          const manager = await tx.branchManager.findUnique({
            where: { userId },
          });
          if (!manager || manager.branchId !== order.branchId) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Branch managers cannot cancel orders outside their assigned branch.",
            });
          }
        }

        // Terminal delivered/returned orders cannot be cancelled
        if (order.status === "DELIVERED" || order.status === "RETURNED" || order.status === "RTO") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Orders in ${order.status} state cannot be cancelled. Use the returns workflow instead.`,
          });
        }

        if (order.status === "CANCELLED") {
          return { success: true, message: "Order already cancelled." };
        }

        await tx.order.update({
          where: { id: input.orderId },
          data: { status: "CANCELLED", notes: input.reason },
        });

        // Release inventory correctly according to how it was deducted
        for (const item of order.items) {
          if (order.paymentMethod === "COD") {
            // COD reserved the inventory without decrementing quantity
            await tx.inventory.update({
              where: { branchId_variantId: { branchId: order.branchId, variantId: item.variantId } },
              data: {
                reserved: { decrement: item.quantity },
              },
            });
          } else {
            // Digital payments decremented quantity
            await tx.inventory.update({
              where: { branchId_variantId: { branchId: order.branchId, variantId: item.variantId } },
              data: {
                quantity: { increment: item.quantity },
              },
            });
          }

          await tx.inventoryTransaction.create({
            data: {
              variantId: item.variantId,
              branchId: order.branchId,
              quantity: item.quantity,
              type: "RETURN",
              referenceId: order.id,
              userId,
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
