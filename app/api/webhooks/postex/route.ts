import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import type { OrderStatus } from "@prisma/client";
import { z } from "zod";
import crypto from "crypto";

export const dynamic = "force-dynamic";

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

const PostExWebhookSchema = z.object({
  trackingNumber: z.string().min(1),
  transactionStatus: z.string().min(1),
  orderRefNumber: z.string().optional(),
  transactionDateTime: z.string().optional(),
  codAmount: z.number().optional(),
  location: z.string().optional(),
});

/**
 * Validates webhook token using constant-time comparison to prevent timing attacks.
 * Fails closed if no secret is configured in production.
 */
function verifyPostExAuth(req: NextRequest): boolean {
  const expectedSecret = process.env.POSTEX_WEBHOOK_SECRET || process.env.POSTEX_API_TOKEN;
  if (!expectedSecret) {
    console.error("[PostEx Webhook] Neither POSTEX_WEBHOOK_SECRET nor POSTEX_API_TOKEN is configured in environment. Rejecting request.");
    return false;
  }

  const headerToken =
    req.headers.get("token") ||
    req.headers.get("x-postex-token") ||
    req.headers.get("x-api-key");
  const authHeader = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const queryToken =
    req.nextUrl.searchParams.get("token") ||
    req.nextUrl.searchParams.get("secret");

  const providedToken = headerToken || authHeader || queryToken || "";

  const providedBuf = Buffer.from(providedToken);
  const expectedBuf = Buffer.from(expectedSecret);

  if (providedBuf.length === 0 || providedBuf.length !== expectedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(providedBuf, expectedBuf);
}

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
 * - Authenticates webhook signature/token
 * - Validates schema with Zod
 * - Creates a TrackingEvent record
 * - Updates the Order status if it has progressed forward
 */
export async function POST(request: NextRequest) {
  // 1. Authenticate webhook request
  if (!verifyPostExAuth(request)) {
    console.error("[PostEx Webhook] Unauthorized access attempt: Invalid token");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rawJson = await request.json().catch(() => null);
    if (!rawJson) {
      return NextResponse.json({ error: "Malformed JSON body" }, { status: 400 });
    }

    const parsed = PostExWebhookSchema.safeParse(rawJson);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload schema", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const body = parsed.data;

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
      console.warn(
        `[PostEx webhook] No order found for tracking number ${body.trackingNumber}`
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
        `[PostEx webhook] Order ${order.orderNumber} status updated: ${order.status} → ${mappedStatus}`
      );
    }

    return NextResponse.json({
      received: true,
      matched: true,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    console.error("[PostEx webhook error]:", error);
    return NextResponse.json({ received: true, error: "Internal processing error" }, { status: 500 });
  }
}

/**
 * GET /api/webhooks/postex
 * Health check endpoint.
 */
export async function GET() {
  return NextResponse.json({
    service: "Executive Mochi - PostEx Webhook",
    status: "active",
    timestamp: new Date().toISOString(),
  });
}
