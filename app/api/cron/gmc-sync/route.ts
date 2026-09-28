import { NextRequest, NextResponse } from 'next/server';
import { verifyCronAuth } from '@/lib/cron-auth';
import { syncAllProductsToGMC } from '@/lib/google-merchant';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/cron/gmc-sync
 * Scheduled Daily at Midnight UTC (0 0 * * *) — FR-CRN-02
 * Synchronizes catalog variants and inventory with Google Merchant Center (GMC).
 */
export async function GET(req: NextRequest) {
  const auth = verifyCronAuth(req);
  if (!auth.authorized) return auth.response!;

  try {
    const result = await syncAllProductsToGMC();

    return NextResponse.json({
      success: result.success,
      mode: result.mode,
      totalProducts: result.totalProducts,
      totalVariants: result.totalVariants,
      syncedVariants: result.syncedVariants,
      errorsCount: result.errors?.length || 0,
      timestamp: result.timestamp,
    });
  } catch (err: any) {
    console.error('[GMC Sync Cron Error]', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error during GMC sync' },
      { status: 500 }
    );
  }
}
