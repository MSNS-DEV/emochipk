/**
 * Meta Conversions API (CAPI) — Server-side event utility
 * Docs: https://developers.facebook.com/docs/marketing-api/conversions-api
 *
 * All customer PII must be hashed with SHA-256 before sending.
 * Events sent here mirror the client-side Meta Pixel for deduplication.
 */
import { createHash } from 'crypto';

const PIXEL_ID  = process.env.META_PIXEL_ID  ?? '2488482501579231';
const API_TOKEN = process.env.META_CAPI_ACCESS_TOKEN ?? '';
const API_URL   = `https://graph.facebook.com/v21.0/${PIXEL_ID}/events`;

// ── Hashing ────────────────────────────────────────────────────────────────

/** SHA-256 hash a string (lowercase + trim first) — returns empty string if input is falsy */
export function hashData(value?: string | null): string {
  if (!value) return '';
  return createHash('sha256').update(value.toLowerCase().trim()).digest('hex');
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface MetaUserData {
  /** Hashed email */
  em?: string;
  /** Hashed phone (digits only, no spaces/dashes) */
  ph?: string;
  /** Hashed first name */
  fn?: string;
  /** Hashed last name */
  ln?: string;
  /** Hashed city (lowercase, no spaces) */
  ct?: string;
  /** Hashed state / province (2-char ISO if available, else lowercase) */
  st?: string;
  /** Hashed postal/zip code */
  zp?: string;
  /** Hashed country code (2-char ISO, e.g. 'pk') */
  country?: string;
  /** NOT hashed — client IP address */
  client_ip_address?: string;
  /** NOT hashed — browser User-Agent string */
  client_user_agent?: string;
  /** NOT hashed — Meta browser cookie (_fbp) */
  fbp?: string;
  /** NOT hashed — Meta click ID cookie (_fbc) */
  fbc?: string;
  /** Hashed external/user ID from your DB */
  external_id?: string;
}

export interface MetaEventContent {
  id: string;       // product SKU or article number
  quantity: number;
  item_price: number;
}

export interface MetaEventData {
  event_name: string;
  event_time: number;
  event_id: string;
  event_source_url?: string;
  action_source: 'website' | 'app' | 'email' | 'phone_call' | 'chat' | 'physical_store' | 'system_generated' | 'other';
  user_data: MetaUserData;
  custom_data?: {
    currency?: string;
    value?: number;
    content_ids?: string[];
    content_type?: string;
    contents?: MetaEventContent[];
    content_name?: string;
    content_category?: string;
    num_items?: number;
    order_id?: string;
  };
}

// ── Sender ─────────────────────────────────────────────────────────────────

/**
 * Send one or more events to Meta CAPI.
 * Silently logs errors — never throws, so it never breaks the order flow.
 */
export async function sendMetaEvents(events: MetaEventData[]): Promise<void> {
  if (!API_TOKEN) {
    // Token not configured — skip silently in dev, warn in prod
    if (process.env.NODE_ENV === 'production') {
      console.warn('[Meta CAPI] META_CAPI_ACCESS_TOKEN is not set — events not sent.');
    }
    return;
  }

  try {
    const payload = {
      data: events,
      test_event_code: process.env.META_CAPI_TEST_CODE, // only used during testing
    };

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[Meta CAPI] Error response:', res.status, text);
    } else {
      const json = await res.json();
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Meta CAPI] Events sent:', JSON.stringify(json, null, 2));
      }
    }
  } catch (err) {
    console.error('[Meta CAPI] Failed to send events:', err);
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Build a hashed user_data object from raw customer fields */
export function buildUserData(opts: {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  userId?: string | null;
  ip?: string | null;
  ua?: string | null;
  fbp?: string | null;
  fbc?: string | null;
}): MetaUserData {
  // Phone: strip all non-digit chars, prepend country code if missing
  const rawPhone = opts.phone?.replace(/\D/g, '') ?? '';
  const normalPhone = rawPhone.startsWith('92') ? rawPhone : rawPhone ? `92${rawPhone.replace(/^0/, '')}` : '';

  return {
    em:                 hashData(opts.email)                   || undefined,
    ph:                 hashData(normalPhone)                  || undefined,
    fn:                 hashData(opts.firstName)               || undefined,
    ln:                 hashData(opts.lastName)                || undefined,
    ct:                 hashData(opts.city?.replace(/\s/g, ''))|| undefined,
    st:                 hashData(opts.state)                   || undefined,
    zp:                 hashData(opts.postalCode)              || undefined,
    country:            hashData(opts.country ?? 'pk')         || undefined,
    external_id:        hashData(opts.userId)                  || undefined,
    client_ip_address:  opts.ip                                || undefined,
    client_user_agent:  opts.ua                                || undefined,
    fbp:                opts.fbp                               || undefined,
    fbc:                opts.fbc                               || undefined,
  };
}

/** Current Unix timestamp (seconds) */
export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}
