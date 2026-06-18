import type {
  CourierTrackingResult,
  CourierTrackingEvent,
  PostExTrackResponse,
  PostExTrackingData,
} from "./types";
import type { OrderStatus } from "@prisma/client";

// ─────────────────────────────────────────────
// PostEx Courier API Client
// API Docs: Merchant API v4 (provided to registered merchants)
// Base URL: https://api.postex.pk/services/integration/api
// Auth: token header (not Bearer)
// ─────────────────────────────────────────────

const POSTEX_BASE_URL = "https://api.postex.pk/services/integration/api";

/**
 * Maps PostEx transaction statuses to internal OrderStatus enum values.
 */
const STATUS_MAP: Record<string, OrderStatus> = {
  "Pending":            "PACKED",
  "Booked":             "PACKED",
  "Picked Up":          "SHIPPED",
  "In Transit":         "SHIPPED",
  "Out for Delivery":   "OUT_FOR_DELIVERY",
  "Delivered":          "DELIVERED",
  "Attempted":          "OUT_FOR_DELIVERY",
  "Re-Attempt":         "OUT_FOR_DELIVERY",
  "Returned":           "RTO",
  "Cancelled":          "CANCELLED",
  "Exception":          "SHIPPED",
};

/**
 * Get the PostEx API token from environment variables.
 * @throws {Error} if the token is not configured
 */
function getToken(): string {
  const token = process.env.POSTEX_API_TOKEN;
  if (!token) {
    throw new Error("POSTEX_API_TOKEN environment variable is not set");
  }
  return token;
}

/**
 * Track a shipment by its PostEx tracking number.
 *
 * Uses the bulk tracking endpoint (works for single tracking numbers too).
 * Endpoint: POST /order/v1/track-bulk-order
 *
 * @param trackingNumber - The PostEx tracking number (14-digit)
 * @returns Normalized tracking result with events
 */
export async function trackOrder(
  trackingNumber: string
): Promise<CourierTrackingResult> {
  const token = getToken();

  const response = await fetch(
    `${POSTEX_BASE_URL}/order/v1/track-bulk-order`,
    {
      method: "POST",
      headers: {
        token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ trackingNumbers: [trackingNumber] }),
    }
  );

  if (!response.ok) {
    throw new Error(`PostEx API HTTP error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as PostExTrackResponse;

  if (data.statusCode !== "200") {
    throw new Error(
      `PostEx API error: ${data.statusMessage || "Unknown error"}`
    );
  }

  // Bulk endpoint returns an array — take the first entry
  const tracking: PostExTrackingData = Array.isArray(data.dist)
    ? data.dist[0]
    : data.dist;

  if (!tracking) {
    throw new Error(`No tracking data found for ${trackingNumber}`);
  }

  // Build the tracking event from available data
  const events: CourierTrackingEvent[] = [];

  // PostEx's bulk track response gives current status + remarks rather than
  // a full event timeline. We construct events from the available data points.
  if (tracking.orderPickupDate) {
    events.push({
      status: "Picked Up",
      statusMessage: "Parcel picked up from seller",
      timestamp: new Date(tracking.orderPickupDate),
    });
  }

  // Add the current status as the latest event
  if (tracking.transactionStatus) {
    events.push({
      status: tracking.transactionStatus,
      statusMessage:
        tracking.remarks || `Status: ${tracking.transactionStatus}`,
      timestamp: tracking.remarksDate
        ? new Date(tracking.remarksDate)
        : new Date(),
    });
  }

  // If delivered, add delivery date event
  if (
    tracking.transactionStatus === "Delivered" &&
    tracking.orderDeliveryDate
  ) {
    events.push({
      status: "Delivered",
      statusMessage: "Parcel delivered successfully",
      timestamp: new Date(tracking.orderDeliveryDate),
    });
  }

  // Deduplicate events by status+timestamp
  const uniqueEvents = events.filter(
    (event, index, self) =>
      index ===
      self.findIndex(
        (e) =>
          e.status === event.status &&
          e.timestamp.getTime() === event.timestamp.getTime()
      )
  );

  // Sort events chronologically (oldest first)
  uniqueEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const currentStatus = tracking.transactionStatus || "Unknown";
  const mappedStatus: OrderStatus =
    STATUS_MAP[currentStatus] || "SHIPPED";

  return {
    trackingNumber: tracking.trackingNumber,
    currentStatus,
    mappedStatus,
    estimatedDelivery: tracking.orderDeliveryDate || undefined,
    courierName: "PostEx",
    events: uniqueEvents,
  };
}
