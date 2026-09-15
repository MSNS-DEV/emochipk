import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { SafepayService } from '@/lib/payment/safepay';
import { sendMetaEvents, buildUserData, nowSeconds } from '@/lib/meta-capi';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const SafepayWebhookSchema = z.object({
  data: z.object({
    token: z.string().optional(),
    tracker: z.string().optional(),
    state: z.string(), // 'PAID' | 'FAILED'
    order_id: z.string().optional(),
    metadata: z.record(z.any()).optional(),
    payment_details: z.object({
      last4: z.string().optional(),
      scheme: z.string().optional(),
    }).optional(),
  }),
});

/**
 * POST /api/webhooks/safepay
 * Cryptographically verifies webhook payloads from Safepay and atomically updates order statuses.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-sfpy-signature') || req.headers.get('x-signature') || '';

    // 1. Verify cryptographic signature
    const isValid = SafepayService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.error('[Safepay Webhook] Invalid or missing HMAC signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    let rawJson: unknown;
    try {
      rawJson = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
    }

    const parsed = SafepayWebhookSchema.safeParse(rawJson);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid webhook schema', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const event = parsed.data.data;
    const tracker = event.token || event.tracker;
    const orderNumber = (event.metadata?.order_id as string | undefined) || event.order_id;
    const state = event.state.toUpperCase();

    if (!orderNumber && !tracker) {
      return NextResponse.json({ error: 'Missing order identifier or tracker' }, { status: 400 });
    }

    // 2. Process order payment state atomically
    const result = await db.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: {
          OR: [
            ...(orderNumber ? [{ orderNumber }] : []),
            ...(tracker ? [{ awbNumber: tracker }] : []),
          ],
        },
        include: {
          items: { include: { variant: { include: { product: true } } } },
          shippingAddress: true,
          user: true,
        },
      });

      if (!order) {
        console.warn(`[Safepay Webhook] No matching order found for ${orderNumber || tracker}`);
        return { matched: false, alreadyProcessed: false, order: null };
      }

      // Idempotency: if already paid/processing, don't duplicate
      if (order.paymentStatus === 'PAID_DIGITAL' || order.status === 'PROCESSING') {
        return { matched: true, alreadyProcessed: true, order };
      }

      if (state === 'PAID') {
        const updated = await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'PAID_DIGITAL',
            status: 'PROCESSING',
          },
          include: {
            items: { include: { variant: { include: { product: true } } } },
            shippingAddress: true,
            user: true,
          },
        });
        return { matched: true, alreadyProcessed: false, order: updated };
      } else if (state === 'FAILED') {
        const updated = await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'CANCELLED',
            paymentStatus: 'UNPAID',
            notes: 'Safepay digital payment failed or was declined by issuing bank.',
          },
          include: {
            items: { include: { variant: { include: { product: true } } } },
            shippingAddress: true,
            user: true,
          },
        });

        // Restore inventory deducted during digital order creation
        for (const item of order.items) {
          await tx.inventory.update({
            where: { branchId_variantId: { branchId: order.branchId, variantId: item.variantId } },
            data: { quantity: { increment: item.quantity } },
          });

          await tx.inventoryTransaction.create({
            data: {
              variantId: item.variantId,
              branchId: order.branchId,
              quantity: item.quantity,
              type: "RETURN",
              referenceId: order.id,
              userId: order.userId,
            },
          });
        }

        return { matched: true, alreadyProcessed: false, order: updated };
      }

      return { matched: true, alreadyProcessed: true, order };
    });

    // 3. Fire Meta CAPI Purchase event for freshly captured payments
    if (!result.alreadyProcessed && result.order && state === 'PAID') {
      const order = result.order;
      const addr = order.shippingAddress;
      const [firstName, ...rest] = (addr?.fullName ?? '').split(' ');

      void sendMetaEvents([
        {
          event_name: 'Purchase',
          event_time: nowSeconds(),
          event_id: `purchase-${order.id}`,
          event_source_url: 'https://executivemochi.pk/checkout',
          action_source: 'website',
          user_data: buildUserData({
            email: order.user?.email,
            phone: addr?.phone,
            firstName,
            lastName: rest.join(' '),
            city: addr?.city,
            state: addr?.province,
            postalCode: addr?.postalCode ?? undefined,
            country: 'pk',
            userId: order.userId,
          }),
          custom_data: {
            order_id: order.orderNumber,
            currency: 'PKR',
            value: Number(order.totalAmount),
            num_items: order.items.length,
            content_type: 'product',
          },
        },
      ]);
    }

    return NextResponse.json({ received: true, processed: !result.alreadyProcessed });
  } catch (error) {
    console.error('[Safepay Webhook Error]:', error);
    return NextResponse.json(
      { error: 'Internal processing error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'Executive Mochi - Safepay Webhook',
    status: 'active',
    timestamp: new Date().toISOString(),
  });
}
