import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  branchManagerProcedure,
} from "@/server/trpc";
import {
  trackShipment,
  isTrackingSupported,
  getCourierDisplayName,
} from "@/lib/courier";
import type { CourierTrackingResult } from "@/lib/courier";

// ─────────────────────────────────────────────
// Courier Tracking Router
// Provides tRPC procedures for tracking shipments
// via PostEx and Pakistan Post courier APIs.
// SRS: FR-LOG-02, FR-ORD-20
// ─────────────────────────────────────────────

export const courierRouter = createTRPCRouter({
  /**
   * Public tracking by order number (FR-ORD-20)
   *
   * Looks up the order in the database, then calls the courier API
   * for live tracking data. Stores new tracking events in the DB.
   * No login required — customers can track via the public tracking page.
   */
  trackByOrderNumber: publicProcedure
    .input(z.string().min(1, "Order number is required"))
    .query(async ({ ctx, input: orderNumber }) => {
      // 1. Find the order with its courier info
      const order = await ctx.db.order.findFirst({
        where: { orderNumber },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          courierService: true,
          trackingNumber: true,
          awbNumber: true,
          createdAt: true,
          updatedAt: true,
          shippingAddress: { select: { city: true, province: true } },
          items: {
            select: {
              quantity: true,
              variant: {
                select: {
                  color: true,
                  sizeUK: true,
                  product: { select: { name: true } },
                },
              },
            },
          },
          trackingEvents: {
            orderBy: { timestamp: "asc" },
          },
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No order found with number: ${orderNumber}`,
        });
      }

      // 2. If no courier assigned yet, return DB-only tracking
      if (!order.courierService || !order.trackingNumber) {
        return {
          order: {
            orderNumber: order.orderNumber,
            status: order.status,
            courierService: order.courierService,
            trackingNumber: order.trackingNumber,
            createdAt: order.createdAt,
            shippingAddress: order.shippingAddress,
            items: order.items,
          },
          courier: null as CourierTrackingResult | null,
          storedEvents: order.trackingEvents,
          trackingSupported: false,
        };
      }

      // 3. Check if we have a live integration for this courier
      if (!isTrackingSupported(order.courierService)) {
        return {
          order: {
            orderNumber: order.orderNumber,
            status: order.status,
            courierService: order.courierService,
            courierName: getCourierDisplayName(order.courierService),
            trackingNumber: order.trackingNumber,
            createdAt: order.createdAt,
            shippingAddress: order.shippingAddress,
            items: order.items,
          },
          courier: null as CourierTrackingResult | null,
          storedEvents: order.trackingEvents,
          trackingSupported: false,
        };
      }

      // 4. Call the courier API for live tracking
      let courierResult: CourierTrackingResult | null = null;

      try {
        courierResult = await trackShipment(
          order.courierService,
          order.trackingNumber,
          order.id
        );

        // 5. Store new tracking events in the database
        if (courierResult.events.length > 0) {
          for (const event of courierResult.events) {
            // Upsert — avoid duplicates by checking status + timestamp combo
            const existing = await ctx.db.trackingEvent.findFirst({
              where: {
                orderId: order.id,
                status: event.status,
                timestamp: event.timestamp,
              },
            });

            if (!existing) {
              await ctx.db.trackingEvent.create({
                data: {
                  orderId: order.id,
                  courierService: order.courierService,
                  status: event.status,
                  statusMessage: event.statusMessage,
                  location: event.location,
                  timestamp: event.timestamp,
                },
              });
            }
          }

          // 6. Update order status if courier reports a newer status
          const shouldUpdate =
            courierResult.mappedStatus !== order.status &&
            isStatusProgression(order.status, courierResult.mappedStatus);

          if (shouldUpdate) {
            await ctx.db.order.update({
              where: { id: order.id },
              data: { status: courierResult.mappedStatus },
            });
          }
        }
      } catch (error) {
        // If courier API fails, fall back to stored events
        console.error(
          `Courier API error for ${order.courierService}:`,
          error instanceof Error ? error.message : error
        );
      }

      // Re-fetch stored events after potential inserts
      const storedEvents = await ctx.db.trackingEvent.findMany({
        where: { orderId: order.id },
        orderBy: { timestamp: "asc" },
      });

      return {
        order: {
          orderNumber: order.orderNumber,
          status: order.status,
          courierService: order.courierService,
          courierName: getCourierDisplayName(order.courierService),
          trackingNumber: order.trackingNumber,
          createdAt: order.createdAt,
          shippingAddress: order.shippingAddress,
          items: order.items,
        },
        courier: courierResult,
        storedEvents,
        trackingSupported: true,
      };
    }),

  /**
   * Track by courier tracking number directly (public).
   * Requires knowing which courier service the tracking number belongs to.
   */
  trackByTrackingNumber: publicProcedure
    .input(
      z.object({
        trackingNumber: z.string().min(1),
        courierService: z.enum(["POSTEX", "PAKISTAN_POST", "LEOPARDS", "TRAX"]),
      })
    )
    .query(async ({ input }) => {
      if (!isTrackingSupported(input.courierService)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Live tracking is not available for ${getCourierDisplayName(input.courierService)}. Only PostEx and Pakistan Post are supported.`,
        });
      }

      return trackShipment(input.courierService, input.trackingNumber);
    }),

  /**
   * Force-sync tracking status from courier API (branch manager / admin).
   * Fetches the latest status and updates the order + stores events.
   */
  syncTracking: branchManagerProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.order.findUniqueOrThrow({
        where: { id: input.orderId },
        select: {
          id: true,
          courierService: true,
          trackingNumber: true,
          status: true,
        },
      });

      if (!order.courierService || !order.trackingNumber) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Order has no courier or tracking number assigned.",
        });
      }

      if (!isTrackingSupported(order.courierService)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Live tracking sync is not available for ${getCourierDisplayName(order.courierService)}.`,
        });
      }

      const result = await trackShipment(
        order.courierService,
        order.trackingNumber,
        order.id
      );

      // Store all new events
      let newEventsCount = 0;
      for (const event of result.events) {
        const existing = await ctx.db.trackingEvent.findFirst({
          where: {
            orderId: order.id,
            status: event.status,
            timestamp: event.timestamp,
          },
        });

        if (!existing) {
          await ctx.db.trackingEvent.create({
            data: {
              orderId: order.id,
              courierService: order.courierService,
              status: event.status,
              statusMessage: event.statusMessage,
              location: event.location,
              timestamp: event.timestamp,
            },
          });
          newEventsCount++;
        }
      }

      // Update order status if it progressed
      const shouldUpdate =
        result.mappedStatus !== order.status &&
        isStatusProgression(order.status, result.mappedStatus);

      if (shouldUpdate) {
        await ctx.db.order.update({
          where: { id: order.id },
          data: { status: result.mappedStatus },
        });
      }

      return {
        success: true,
        newEventsCount,
        currentStatus: result.currentStatus,
        mappedStatus: result.mappedStatus,
        statusUpdated: shouldUpdate,
      };
    }),

  /**
   * Get stored tracking events for an order (authenticated users).
   * Returns events from the database without making courier API calls.
   */
  getTrackingEvents: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: orderId }) => {
      const order = await ctx.db.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          userId: true,
          orderNumber: true,
          status: true,
          courierService: true,
          trackingNumber: true,
        },
      });

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }

      // Customers can only view their own orders
      if (
        ctx.session.user.role === "CUSTOMER" &&
        order.userId !== ctx.session.user.id
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const events = await ctx.db.trackingEvent.findMany({
        where: { orderId },
        orderBy: { timestamp: "asc" },
      });

      return {
        order: {
          orderNumber: order.orderNumber,
          status: order.status,
          courierService: order.courierService,
          courierName: order.courierService
            ? getCourierDisplayName(order.courierService)
            : null,
          trackingNumber: order.trackingNumber,
        },
        events,
      };
    }),
});

/**
 * Determines if transitioning from `current` to `next` is a valid
 * forward progression in the order lifecycle.
 * Prevents courier API responses from moving status backwards.
 */
function isStatusProgression(current: string, next: string): boolean {
  const ORDER: string[] = [
    "PENDING",
    "PENDING_VERIFICATION",
    "VERIFIED",
    "PROCESSING",
    "PACKED",
    "SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
  ];

  // RTO can happen from SHIPPED or OUT_FOR_DELIVERY
  if (next === "RTO" && (current === "SHIPPED" || current === "OUT_FOR_DELIVERY")) {
    return true;
  }

  const currentIdx = ORDER.indexOf(current);
  const nextIdx = ORDER.indexOf(next);

  // If either status is not in the normal flow, don't auto-update
  if (currentIdx === -1 || nextIdx === -1) return false;

  // Only allow forward progression
  return nextIdx > currentIdx;
}
