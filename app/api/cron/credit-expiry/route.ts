import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { verifyCronAuth } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/cron/credit-expiry
 * Scheduled Daily at 01:00 AM UTC (0 1 * * *) — FR-CRN-04
 * Scans active store credit vouchers and expires those past their validity date.
 */
export async function GET(req: NextRequest) {
  const auth = verifyCronAuth(req);
  if (!auth.authorized) return auth.response!;

  try {
    const now = new Date();

    const result = await db.storeCredit.updateMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { lt: now },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    return NextResponse.json({
      success: true,
      expiredVouchers: result.count,
      timestamp: now.toISOString(),
    });
  } catch (err: any) {
    console.error('[Credit Expiry Cron Error]', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error during credit expiry check' },
      { status: 500 }
    );
  }
}
