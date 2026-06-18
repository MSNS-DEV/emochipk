import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import type { PostExWebhookPayload } from "@/lib/courier/types";
import type { OrderStatus } from "@prisma/client";

// ─────────────────────────────────────────────
// PostEx Webhook Handler
// Receives push notifications from PostEx when
// a parcel's tracking status changes.
//
// Setup: Register this URL in your PostEx Merchant Dashboard:
//   https://executivemochi.pk/api/webhooks/postex
//
// SRS: FR-LOG-02, FR-LOG-06, FR-LOG-10
// ─────────────────────────────────────────────

/**
 * Maps PostEx webhook statuses to internal OrderStatus.
 */
const STATUS_MAP: Record<string, OrderStatus> = {
  "Pending":          "PACKED",
  "Booked":           "PACKED",
  "Picked Up":        "SHIPPED",
  "In Transit":       "SHIPPED",
  "Out for Delivery": "OUT_FOR_DELIVERY",
  "Delivered":        "DELIVERED",
  "Attempted":        "OUT_FOR_DELIVERY",
  "Re-Attempt":       "OUT_FOR_DELIVERY",
  "Returned":         "RTO",
  "Cancelled":        "CANCELLED",
  "Exception":        "SHIPPED",
};

/**
 * Determines if moving from current to next status is a valid forward progression.
 */
function isStatusProgression(current: string, next: string): boolean {
  const ORDER: string[] = [
    "PENDING", "PENDING_VERIFICATION", "VERIFIED",
    "PROCESSING", "PACKED", "SHIPPED",
    "OUT_FOR_DELIVERY", "DELIVERED",
  ];

  if (next === "RTO" && (current === "SHIPPED" || current === "OUT_FOR_DELIVERY")) {
    return true;
  }

  const currentIdx = ORDER.indexOf(current);
  const nextIdx = ORDER.indexOf(next);
  if (currentIdx === -1 || nextIdx === -1) return false;
  return nextIdx > currentIdx;
}

/**
 * POST /api/webhooks/postex
 *
 * Receives tracking status updates from PostEx.
 * - Creates a TrackingEvent record
 * - Updates the Order status if it has progressed forward
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PostExWebhookPayload;

    // Validate required fields
    if (!body.trackingNumber || !body.transactionStatus) {
      return NextResponse.json(
        { error: "Missing required fields: trackingNumber, transactionStatus" },
        { status: 400 }
      );
    }

    // Find the order by tracking number
    const order = await db.order.findFirst({
      where: {
        trackingNumber: body.trackingNumber,
        courierService: "POSTEX",
      },
      select: {
        id: true,
        status: true,
        orderNumber: true,
      },
    });

    if (!order) {
      // Log but still return 200 to prevent PostEx from retrying
      console.warn(
        `PostEx webhook: No order found for tracking number ${body.trackingNumber}`
      );
      return NextResponse.json({ received: true, matched: false });
    }

    // Create tracking event record
    await db.trackingEvent.create({
      data: {
        orderId: order.id,
        courierService: "POSTEX",
        status: body.transactionStatus,
        statusMessage: `PostEx: ${body.transactionStatus}`,
        location: body.location || undefined,
        timestamp: body.transactionDateTime
          ? new Date(body.transactionDateTime)
          : new Date(),
        rawPayload: body as any,
      },
    });

    // Update order status if it has progressed
    const mappedStatus = STATUS_MAP[body.transactionStatus];
    if (mappedStatus && isStatusProgression(order.status, mappedStatus)) {
      await db.order.update({
        where: { id: order.id },
        data: { status: mappedStatus },
      });

      console.log(
        `PostEx webhook: Order ${order.orderNumber} status updated: ${order.status} → ${mappedStatus}`
      );
    }

    return NextResponse.json({
      received: true,
      matched: true,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    console.error("PostEx webhook error:", error);
    // Return 200 even on error to prevent PostEx from retrying indefinitely
    return NextResponse.json({ received: true, error: "Internal processing error" });
  }
}

/**
 * GET /api/webhooks/postex
 * Health check endpoint — useful for verifying the webhook URL is accessible.
 */
export async function GET() {
  return NextResponse.json({
    service: "Executive Mochi - PostEx Webhook",
    status: "active",
    timestamp: new Date().toISOString(),
  });
}
