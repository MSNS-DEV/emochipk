import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { verifyCronAuth } from '@/lib/cron-auth';
import { trackShipment, isTrackingSupported } from '@/lib/courier';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Up to 60 seconds execution limit (FR-CRN-08)

/**
 * GET /api/cron/courier-sync
 * Scheduled Bi-Hourly (0 *\/2 * * *) — FR-CRN-01
 * Synchronizes tracking status for all SHIPPED or OUT_FOR_DELIVERY orders with couriers.
 */
export async function GET(req: NextRequest) {
  const auth = verifyCronAuth(req);
  if (!auth.authorized) return auth.response!;

  try {
    const orders = await db.order.findMany({
      where: {
        status: { in: ['SHIPPED', 'OUT_FOR_DELIVERY'] },
        courierService: { not: null },
        OR: [
          { trackingNumber: { not: null } },
          { awbNumber: { not: null } },
        ],
      },
      include: {
        trackingEvents: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
      take: 50, // Batch limit per execution
    });

    let updatedOrders = 0;
    let eventsCreated = 0;
    const errors: string[] = [];

    for (const order of orders) {
      const courier = order.courierService!;
      const trackingCode = order.trackingNumber || order.awbNumber;

      if (!trackingCode || !isTrackingSupported(courier)) {
        continue;
      }

      try {
        const trackingResult = await trackShipment(courier, trackingCode, order.id);

        // Record any new tracking events
        for (const ev of trackingResult.events) {
          const lastEvent = order.trackingEvents[0];
          const isDuplicate =
            lastEvent &&
            lastEvent.status === ev.status &&
            Math.abs(new Date(lastEvent.timestamp).getTime() - new Date(ev.timestamp).getTime()) < 60000;

          if (!isDuplicate) {
            await db.trackingEvent.create({
              data: {
                orderId: order.id,
                courierService: courier,
                status: ev.status,
                statusMessage: ev.statusMessage,
                location: ev.location || null,
                timestamp: ev.timestamp,
                rawPayload: ev as any,
              },
            });
            eventsCreated++;
          }
        }

        // Check if status should transition
        const newStatus = trackingResult.mappedStatus;
        if (newStatus && newStatus !== order.status) {
          const updateData: Record<string, any> = { status: newStatus };

          if (newStatus === 'DELIVERED') {
            if (order.paymentMethod === 'COD' && order.paymentStatus === 'UNPAID') {
              updateData.paymentStatus = 'COD_PENDING_COLLECTION';
            }
          }

          await db.order.update({
            where: { id: order.id },
            data: updateData,
          });
          updatedOrders++;
        }
      } catch (err: any) {
        errors.push(`Order ${order.orderNumber} (${courier}): ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      processedOrders: orders.length,
      updatedOrders,
      eventsCreated,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[Courier Sync Cron Error]', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
