import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { verifyCronAuth } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const HOLD_TTL_MINUTES = parseInt(process.env.INVENTORY_HOLD_TTL_MINUTES || '30', 10);

/**
 * GET /api/cron/inventory-cleanup
 * Scheduled Every 30 Minutes (*\/30 * * * *) — FR-CRN-03
 * Identifies expired checkout reservations, restores inventory, and cancels abandoned orders.
 */
export async function GET(req: NextRequest) {
  const auth = verifyCronAuth(req);
  if (!auth.authorized) return auth.response!;

  try {
    const cutoffTime = new Date(Date.now() - HOLD_TTL_MINUTES * 60 * 1000);

    // 1. Find unpaid digital payment orders created > HOLD_TTL_MINUTES ago that are still PENDING
    const abandonedOrders = await db.order.findMany({
      where: {
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        paymentMethod: { not: 'COD' },
        createdAt: { lt: cutoffTime },
      },
      include: {
        items: true,
      },
      take: 50,
    });

    let cancelledOrders = 0;
    let releasedItems = 0;

    for (const order of abandonedOrders) {
      await db.$transaction(async (tx) => {
        // Restore stock deducted during digital checkout
        for (const item of order.items) {
          await tx.inventory.updateMany({
            where: {
              branchId: order.branchId,
              variantId: item.variantId,
            },
            data: {
              quantity: { increment: item.quantity },
            },
          });

          await tx.inventoryTransaction.create({
            data: {
              variantId: item.variantId,
              branchId: order.branchId,
              quantity: item.quantity,
              type: 'ADJUSTMENT',
              referenceId: order.id,
              userId: order.userId,
            },
          });
          releasedItems++;
        }

        // Cancel order
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'CANCELLED',
            notes: `Auto-cancelled: Payment session abandoned after ${HOLD_TTL_MINUTES} minutes. Stock restored.`,
          },
        });
        cancelledOrders++;
      });
    }

    return NextResponse.json({
      success: true,
      holdTtlMinutes: HOLD_TTL_MINUTES,
      cancelledOrders,
      releasedItems,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[Inventory Cleanup Cron Error]', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
