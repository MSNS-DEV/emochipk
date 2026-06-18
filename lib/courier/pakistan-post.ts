import type {
  CourierTrackingResult,
  CourierTrackingEvent,
  TrackingMoreResponse,
  TrackingMoreTrackingData,
  TrackingMoreCheckpoint,
} from "./types";
import type { OrderStatus } from "@prisma/client";

// ─────────────────────────────────────────────
// Pakistan Post Tracking Client (via TrackingMore API)
//
// Pakistan Post has NO official public REST API.
// We use TrackingMore (https://www.trackingmore.com) as a
// third-party aggregator with carrier code "pakistan-post".
//
// API Docs: https://www.trackingmore.com/docs/trackingmore/d5a120ef52f26-api-overview
// Auth: Tracking-Api-Key header
// ─────────────────────────────────────────────

const TRACKINGMORE_BASE_URL = "https://api.trackingmore.com/v4";
const CARRIER_CODE = "pakistan-post";

/**
 * Maps TrackingMore delivery_status to internal OrderStatus enum.
 */
const STATUS_MAP: Record<string, OrderStatus> = {
  pending:       "PACKED",
  notfound:      "PACKED",
  infoReceived:  "PACKED",
  transit:       "SHIPPED",
  pickup:        "SHIPPED",
  delivered:     "DELIVERED",
  expired:       "RTO",
  undelivered:   "RTO",
  exception:     "SHIPPED",
};

/**
 * Maps checkpoint sub-statuses to more granular OrderStatus values.
 */
const CHECKPOINT_STATUS_MAP: Record<string, OrderStatus> = {
  "OutForDelivery":     "OUT_FOR_DELIVERY",
  "Delivered":          "DELIVERED",
  "AvailableForPickup": "OUT_FOR_DELIVERY",
  "InTransit":          "SHIPPED",
  "InfoReceived":       "PACKED",
  "Exception":          "SHIPPED",
  "FailedAttempt":      "OUT_FOR_DELIVERY",
  "Returned":           "RTO",
};

/**
 * Get the TrackingMore API key from environment variables.
 * @throws {Error} if the key is not configured
 */
function getApiKey(): string {
  const key = process.env.TRACKINGMORE_API_KEY;
  if (!key) {
    throw new Error("TRACKINGMORE_API_KEY environment variable is not set");
  }
  return key;
}

/**
 * Create a tracking entry in TrackingMore for a Pakistan Post shipment.
 * This must be done before you can retrieve tracking updates.
 *
 * @param trackingNumber - Pakistan Post tracking number (UPU format: EE123456789PK)
 * @param orderId - Optional internal order ID to associate
 */
async function createTracking(
  trackingNumber: string,
  orderId?: string
): Promise<void> {
  const apiKey = getApiKey();

  try {
    const response = await fetch(`${TRACKINGMORE_BASE_URL}/trackings/create`, {
      method: "POST",
      headers: {
        "Tracking-Api-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tracking_number: trackingNumber,
        courier_code: CARRIER_CODE,
        order_id: orderId,
      }),
    });

    if (!response.ok) {
      let errorData: any = null;
      try {
        errorData = await response.json();
      } catch {}
      if (errorData?.meta?.code === 4031) {
        return;
      }
      throw new Error(`TrackingMore create error: ${response.status}`);
    }
  } catch (error: unknown) {
    throw error;
  }
}

/**
 * Convert TrackingMore checkpoints to our unified CourierTrackingEvent format.
 */
function parseCheckpoints(
  checkpoints: TrackingMoreCheckpoint[]
): CourierTrackingEvent[] {
  return checkpoints.map((cp) => ({
    status: cp.checkpoint_delivery_status || "In Transit",
    statusMessage: cp.tracking_detail || "Status update",
    location: cp.location || undefined,
    timestamp: new Date(cp.checkpoint_date),
  }));
}

/**
 * Track a Pakistan Post shipment via TrackingMore.
 *
 * If the tracking number hasn't been registered with TrackingMore yet,
 * it will be created first and then fetched.
 *
 * @param trackingNumber - Pakistan Post tracking number (e.g., EE123456789PK)
 * @param orderId - Optional internal order ID
 * @returns Normalized tracking result with events
 */
export async function trackOrder(
  trackingNumber: string,
  orderId?: string
): Promise<CourierTrackingResult> {
  const apiKey = getApiKey();

  // First, try to get existing tracking data
  let trackingData: TrackingMoreTrackingData | null = null;

  try {
    const params = new URLSearchParams({
      tracking_numbers: trackingNumber,
      courier_code: CARRIER_CODE,
    });
    const response = await fetch(
      `${TRACKINGMORE_BASE_URL}/trackings/get?${params.toString()}`,
      {
        headers: {
          "Tracking-Api-Key": apiKey,
        },
      }
    );

    let data: any = null;
    try {
      data = await response.json();
    } catch {}

    if (response.ok && data?.meta?.code === 200 && data.data) {
      trackingData = Array.isArray(data.data) ? data.data[0] : data.data;
    } else if (data?.meta?.code && [4031, 4032, 4033].includes(data.meta.code)) {
      trackingData = null;
    } else {
      throw new Error(`TrackingMore API error: ${response.status}`);
    }
  } catch (error: unknown) {
    throw error;
  }

  // If no tracking data found, create the tracking and re-fetch
  if (!trackingData) {
    await createTracking(trackingNumber, orderId);

    // Wait briefly for TrackingMore to process, then fetch
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      const params = new URLSearchParams({
        tracking_numbers: trackingNumber,
        courier_code: CARRIER_CODE,
      });
      const response = await fetch(
        `${TRACKINGMORE_BASE_URL}/trackings/get?${params.toString()}`,
        {
          headers: {
            "Tracking-Api-Key": apiKey,
          },
        }
      );

      let data: any = null;
      try {
        data = await response.json();
      } catch {}

      if (response.ok && data?.meta?.code === 200 && data.data) {
        trackingData = Array.isArray(data.data) ? data.data[0] : data.data;
      }
    } catch {
      // If still failing, return a minimal result
    }
  }

  // Build the response
  if (!trackingData) {
    return {
      trackingNumber,
      currentStatus: "Pending",
      mappedStatus: "PACKED",
      courierName: "Pakistan Post",
      events: [
        {
          status: "Booked",
          statusMessage:
            "Tracking registered. Pakistan Post updates may take 24-48 hours to appear.",
          timestamp: new Date(),
        },
      ],
    };
  }

  // Extract events from origin_info and destination_info checkpoints
  const events: CourierTrackingEvent[] = [];

  if (trackingData.origin_info?.trackinfo) {
    events.push(...parseCheckpoints(trackingData.origin_info.trackinfo));
  }
  if (trackingData.destination_info?.trackinfo) {
    events.push(...parseCheckpoints(trackingData.destination_info.trackinfo));
  }

  // Sort events chronologically (oldest first)
  events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  // Determine current status
  const currentStatus =
    trackingData.latest_event || trackingData.delivery_status || "Pending";

  // Map to our internal status — check the latest checkpoint first for granularity
  const lastCheckpoint =
    events.length > 0 ? events[events.length - 1] : undefined;
  let mappedStatus: OrderStatus =
    STATUS_MAP[trackingData.delivery_status] || "SHIPPED";

  if (lastCheckpoint) {
    const checkpointMapped = CHECKPOINT_STATUS_MAP[lastCheckpoint.status];
    if (checkpointMapped) {
      mappedStatus = checkpointMapped;
    }
  }

  return {
    trackingNumber: trackingData.tracking_number,
    currentStatus,
    mappedStatus,
    estimatedDelivery: undefined, // Pakistan Post doesn't provide ETA
    courierName: "Pakistan Post",
    events:
      events.length > 0
        ? events
        : [
            {
              status: trackingData.delivery_status || "Pending",
              statusMessage:
                trackingData.latest_event ||
                "Tracking registered. Updates may take 24-48 hours.",
              timestamp: trackingData.latest_checkpoint_time
                ? new Date(trackingData.latest_checkpoint_time)
                : new Date(),
            },
          ],
  };
}
