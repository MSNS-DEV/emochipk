import type { OrderStatus } from "@prisma/client";

// ─────────────────────────────────────────────
// Unified Courier Tracking Types
// Used by all courier API clients (PostEx, Pakistan Post, etc.)
// ─────────────────────────────────────────────

/** A single tracking event from a courier API */
export interface CourierTrackingEvent {
  /** Raw status string from the courier (e.g., "Picked Up", "In Transit") */
  status: string;
  /** Human-readable description of the event */
  statusMessage: string;
  /** Location/city where the event occurred */
  location?: string;
  /** When the event happened (from the courier) */
  timestamp: Date;
}

/** Unified tracking result returned by all courier clients */
export interface CourierTrackingResult {
  /** The courier tracking number */
  trackingNumber: string;
  /** Current status as reported by the courier */
  currentStatus: string;
  /** Maps courier status → our internal OrderStatus enum */
  mappedStatus: OrderStatus;
  /** Estimated delivery date (if available) */
  estimatedDelivery?: string;
  /** Display name of the courier service */
  courierName: string;
  /** Chronological list of tracking events (oldest first) */
  events: CourierTrackingEvent[];
}

/** Configuration for a courier API client */
export interface CourierClientConfig {
  apiKey: string;
  baseUrl: string;
}

/** PostEx-specific API response types */
export interface PostExTrackResponse {
  statusCode: string;
  statusMessage: string;
  dist: PostExTrackingData | PostExTrackingData[];
}

export interface PostExTrackingData {
  trackingNumber: string;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  invoicePayment?: number;
  transactionStatus: string;
  orderDetail?: string;
  orderPickupDate?: string;
  orderDeliveryDate?: string;
  merchantName?: string;
  remarks?: string;
  remarksDate?: string;
}

/** PostEx webhook payload */
export interface PostExWebhookPayload {
  trackingNumber: string;
  orderRefNumber?: string;
  transactionStatus: string;
  transactionDateTime?: string;
  codAmount?: number;
  location?: string;
}

/** TrackingMore API response types (used for Pakistan Post) */
export interface TrackingMoreResponse {
  meta: {
    code: number;
    type: string;
    message: string;
  };
  data: TrackingMoreTrackingData | TrackingMoreTrackingData[];
}

export interface TrackingMoreTrackingData {
  id: string;
  tracking_number: string;
  courier_code: string;
  order_id?: string;
  delivery_status: string; // "pending" | "notfound" | "transit" | "pickup" | "delivered" | "expired" | "undelivered" | "exception" | "infoReceived"
  archived: boolean;
  updating: boolean;
  destination_country?: string;
  origin_country?: string;
  latest_event?: string;
  latest_checkpoint_time?: string;
  origin_info?: TrackingMoreOriginDestInfo;
  destination_info?: TrackingMoreOriginDestInfo;
}

export interface TrackingMoreOriginDestInfo {
  trackinfo: TrackingMoreCheckpoint[];
}

export interface TrackingMoreCheckpoint {
  checkpoint_date: string;        // ISO date string
  tracking_detail: string;        // Description of event
  location?: string;              // Location where event happened
  checkpoint_delivery_status: string; // Status at this checkpoint
  checkpoint_delivery_substatus?: string;
}
