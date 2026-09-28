import { NextRequest, NextResponse } from 'next/server';

/**
 * Validates CRON_SECRET authorization for all /api/cron/* background routes (FR-CRN-08).
 * Checks the standard `Authorization: Bearer <secret>` header.
 */
export function verifyCronAuth(req: NextRequest): { authorized: boolean; response?: NextResponse } {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // In production, require CRON_SECRET matching Bearer token
  if (process.env.NODE_ENV === 'production' || cronSecret) {
    if (!cronSecret) {
      console.warn('[Cron Auth] CRON_SECRET is not configured on server.');
      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'CRON_SECRET is not configured on server.' },
          { status: 500 }
        ),
      };
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'Unauthorized: Invalid cron bearer secret.' },
          { status: 401 }
        ),
      };
    }
  }

  return { authorized: true };
}
