import crypto from 'crypto';

export interface CreateSessionParams {
  amount: number;
  currency: string;
  orderNumber: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResult {
  token: string;
  redirectUrl: string;
  tracker: string;
}

const SAFEPAY_ENV = process.env.SAFEPAY_ENVIRONMENT ?? 'sandbox';
const SAFEPAY_API_KEY = process.env.SAFEPAY_API_KEY ?? '';
const SAFEPAY_WEBHOOK_SECRET = process.env.SAFEPAY_WEBHOOK_SECRET ?? '';

const BASE_URL =
  SAFEPAY_ENV === 'production'
    ? 'https://api.getsafepay.com'
    : 'https://sandbox.api.getsafepay.com';

const CHECKOUT_URL =
  SAFEPAY_ENV === 'production'
    ? 'https://getsafepay.com/checkout/pay'
    : 'https://sandbox.api.getsafepay.com/checkout/pay';

export class SafepayService {
  /**
   * Initializes a payment session on Safepay and returns the checkout token & redirect URL.
   */
  static async createCheckoutSession(params: CreateSessionParams): Promise<CheckoutSessionResult> {
    const res = await fetch(`${BASE_URL}/order/v1/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SFPY-MERCHANT-SECRET': SAFEPAY_API_KEY,
      },
      body: JSON.stringify({
        client: 'custom',
        amount: Math.round(params.amount * 100), // convert to paisa
        currency: params.currency,
        environment: SAFEPAY_ENV,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Safepay initialization failed: ${errText}`);
    }

    const { data } = await res.json();
    const token = data.token;

    const queryParams = new URLSearchParams({
      beacon: token,
      order_id: params.orderNumber,
      redirect_url: params.returnUrl,
      cancel_url: params.cancelUrl,
      source: 'custom',
      webhooks: 'true',
    });

    return {
      token,
      redirectUrl: `${CHECKOUT_URL}?${queryParams.toString()}`,
      tracker: token,
    };
  }

  /**
   * Cryptographically verifies webhook payloads using HMAC-SHA256 in constant time.
   * Uses length-guarded timingSafeEqual to defend against timing attacks and length mismatches.
   */
  static verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const secret = process.env.SAFEPAY_WEBHOOK_SECRET || SAFEPAY_WEBHOOK_SECRET;
    if (!signature || !secret) return false;

    try {
      const computedHex = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

      const cleanSig = signature.trim().toLowerCase();
      const cleanComp = computedHex.trim().toLowerCase();

      const sigBuf = Buffer.from(cleanSig, 'hex');
      const compBuf = Buffer.from(cleanComp, 'hex');

      if (sigBuf.length === 0 || sigBuf.length !== compBuf.length) {
        return false;
      }

      return crypto.timingSafeEqual(sigBuf, compBuf);
    } catch (e) {
      console.error('[Safepay] Signature verification error:', e);
      return false;
    }
  }
}
