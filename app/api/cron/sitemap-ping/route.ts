import { NextRequest, NextResponse } from 'next/server';
import { verifyCronAuth } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/cron/sitemap-ping
 * Scheduled Weekly on Sunday at 03:00 AM UTC (0 3 * * 0) — FR-CRN-07
 * Verifies dynamic XML sitemap freshness, GEO llms.txt accessibility, and pings search engines.
 */
export async function GET(req: NextRequest) {
  const auth = verifyCronAuth(req);
  if (!auth.authorized) return auth.response!;

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    'https://executivemochi.pk';

  const sitemapUrl = `${appUrl}/sitemap.xml`;
  const pingResults: Array<{ target: string; status: number | string }> = [];

  try {
    // 1. Verify internal sitemap generation
    let sitemapOk = false;
    try {
      const res = await fetch(sitemapUrl, { method: 'HEAD', cache: 'no-store' });
      sitemapOk = res.ok;
      pingResults.push({ target: 'sitemap_self_check', status: res.status });
    } catch (e: any) {
      pingResults.push({ target: 'sitemap_self_check', status: e.message });
    }

    // 2. Ping Google Search Central & Bing Webmaster endpoints
    const pingTargets = [
      `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
      `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
    ];

    for (const url of pingTargets) {
      try {
        const res = await fetch(url, { method: 'GET' });
        pingResults.push({ target: url, status: res.status });
      } catch (e: any) {
        pingResults.push({ target: url, status: e.message });
      }
    }

    // 3. Verify llms.txt accessibility
    let llmsOk = false;
    try {
      const llmsRes = await fetch(`${appUrl}/llms.txt`, { method: 'HEAD', cache: 'no-store' });
      llmsOk = llmsRes.ok;
      pingResults.push({ target: 'llms_txt_check', status: llmsRes.status });
    } catch (e: any) {
      pingResults.push({ target: 'llms_txt_check', status: e.message });
    }

    return NextResponse.json({
      success: true,
      sitemapUrl,
      sitemapAccessible: sitemapOk,
      llmsAccessible: llmsOk,
      results: pingResults,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[Sitemap Ping Cron Error]', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error during sitemap ping' },
      { status: 500 }
    );
  }
}
