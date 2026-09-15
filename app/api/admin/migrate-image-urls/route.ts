import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/server/db';

export const dynamic = 'force-dynamic';

const ALLOWED_TARGET_HOSTS = [
  'executivemochi.pk',
  'images.executivemochi.pk',
  'cdn.executivemochi.pk',
  'r2.dev',
  'r2.cloudflarestorage.com',
];

function isAllowedDomain(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    return ALLOWED_TARGET_HOSTS.some(
      (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
}

/**
 * POST /api/admin/migrate-image-urls
 *
 * Secure migration endpoint: rewrites image URLs to the target Cloudflare R2 CDN prefix.
 * Requires ADMIN role authentication and validates target URLs against approved domain allowlist.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Forbidden: Admin credentials required.' },
      { status: 403 }
    );
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://executivemochi.pk').replace(/\/$/, '');
  const cdnUrl = (process.env.NEXT_PUBLIC_IMAGE_URL ?? process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '');

  let customTargetUrl = '';
  try {
    const body = await request.json().catch(() => ({}));
    if (body && typeof body.targetUrl === 'string') {
      const trimmed = body.targetUrl.trim();
      if (trimmed) {
        if (!isAllowedDomain(trimmed)) {
          return NextResponse.json(
            { error: 'Invalid targetUrl domain. Must match approved Executive Mochi or Cloudflare R2 domains.' },
            { status: 400 }
          );
        }
        customTargetUrl = trimmed.replace(/\/$/, '');
      }
    }
  } catch (_e) {}

  const targetPrefix = customTargetUrl
    ? `${customTargetUrl}/`
    : cdnUrl
      ? `${cdnUrl}/`
      : `${appUrl}/api/images/`;

  try {
    const images = await db.productImage.findMany({
      select: { id: true, url: true },
    });

    const toMigrate = images.filter((img) => !img.url.startsWith(targetPrefix));

    if (toMigrate.length === 0) {
      return NextResponse.json({
        message: 'All image URLs are already aligned with target prefix.',
        targetPrefix,
        migrated: 0,
      });
    }

    let migrated = 0;
    for (const img of toMigrate) {
      let key = img.url;
      if (img.url.includes('/api/images/')) {
        key = img.url.substring(img.url.indexOf('/api/images/') + '/api/images/'.length);
      } else {
        try {
          const urlObj = new URL(img.url);
          key = urlObj.pathname.replace(/^\/+/, '');
          if (process.env.S3_BUCKET_NAME && key.startsWith(`${process.env.S3_BUCKET_NAME}/`)) {
            key = key.substring(process.env.S3_BUCKET_NAME.length + 1);
          }
        } catch {
          key = img.url.replace(/^\/+/, '');
        }
      }

      // Defend against key corruption
      const cleanKey = key.replace(/^\/+/, '');
      const newUrl = `${targetPrefix}${cleanKey}`;

      await db.productImage.update({
        where: { id: img.id },
        data: { url: newUrl },
      });
      migrated++;
    }

    return NextResponse.json({
      message: `Successfully migrated ${migrated} image URL(s) to target: ${targetPrefix}`,
      targetPrefix,
      migrated,
      sample: toMigrate.slice(0, 3).map((img) => ({
        id: img.id,
        old: img.url,
      })),
    });
  } catch (error) {
    console.error('[migrate-image-urls]', error);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}
