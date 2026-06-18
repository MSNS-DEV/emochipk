import type { CourierService } from "@prisma/client";
import type { CourierTrackingResult } from "./types";
import * as postex from "./postex";
import * as pakistanPost from "./pakistan-post";

// ─────────────────────────────────────────────
// Courier Factory
// Routes tracking requests to the correct API client
// based on the CourierService enum value.
// ─────────────────────────────────────────────

/**
 * Track a shipment using the appropriate courier API client.
 *
 * @param courier - Which courier service to query
 * @param trackingNumber - The courier-issued tracking number
 * @param orderId - Optional internal order ID (used by TrackingMore for Pakistan Post)
 * @returns Normalized tracking result
 * @throws {Error} if the courier is not supported or the API call fails
 */
export async function trackShipment(
  courier: CourierService,
  trackingNumber: string,
  orderId?: string
): Promise<CourierTrackingResult> {
  switch (courier) {
    case "POSTEX":
      return postex.trackOrder(trackingNumber);

    case "PAKISTAN_POST":
      return pakistanPost.trackOrder(trackingNumber, orderId);

    case "LEOPARDS":
    case "TRAX":
      throw new Error(
        `${courier} courier integration is not yet implemented. ` +
        `Only POSTEX and PAKISTAN_POST are currently supported.`
      );

    default:
      throw new Error(`Unknown courier service: ${courier}`);
  }
}

/**
 * Check if a courier service has tracking integration available.
 */
export function isTrackingSupported(courier: CourierService): boolean {
  return courier === "POSTEX" || courier === "PAKISTAN_POST";
}

/**
 * Get the display name for a courier service.
 */
export function getCourierDisplayName(courier: CourierService): string {
  const names: Record<CourierService, string> = {
    LEOPARDS: "Leopards Courier",
    POSTEX: "PostEx",
    TRAX: "Trax Courier",
    PAKISTAN_POST: "Pakistan Post",
  };
  return names[courier] || courier;
}

// Re-export types for convenience
export type { CourierTrackingResult, CourierTrackingEvent } from "./types";
