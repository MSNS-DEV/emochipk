import { NextResponse } from 'next/server';
import { db } from '@/server/db';

/**
 * POST /api/admin/migrate-image-urls
 *
 * One-shot migration: rewrites all image URLs from the old direct-S3 format
 *   https://t3.storageapi.dev/<bucket>/<key>
 * to the new proxy format
 *   https://executivemochi.pk/api/images/<key>
 *
 * Safe to run multiple times (idempotent).
 */
export async function POST(request: Request): Promise<NextResponse> {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://executivemochi.pk').replace(/\/$/, '');
  const cdnUrl = (process.env.NEXT_PUBLIC_IMAGE_URL ?? process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '');

  let customTargetUrl = '';
  try {
    const body = await request.json().catch(() => ({}));
    if (body && typeof body.targetUrl === 'string') {
      customTargetUrl = body.targetUrl.replace(/\/$/, '');
    }
  } catch (_e) {}

  const targetPrefix = customTargetUrl ? `${customTargetUrl}/` : (cdnUrl ? `${cdnUrl}/` : `${appUrl}/api/images/`);

  try {
    // Find all images whose URLs do not already match the target prefix
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
      // Extract key from either /api/images/<key>, old S3 URL, or direct path
      let key = img.url;
      if (img.url.includes('/api/images/')) {
        key = img.url.substring(img.url.indexOf('/api/images/') + '/api/images/'.length);
      } else {
        const urlObj = new URL(img.url);
        key = urlObj.pathname.replace(/^\/+/, '');
        // If path begins with bucket name, strip it
        if (process.env.S3_BUCKET_NAME && key.startsWith(`${process.env.S3_BUCKET_NAME}/`)) {
          key = key.substring(process.env.S3_BUCKET_NAME.length + 1);
        }
      }

      const newUrl = `${targetPrefix}${key.replace(/^\/+/, '')}`;
      await db.productImage.update({
        where: { id: img.id },
        data: { url: newUrl },
      });
      migrated++;
    }

    return NextResponse.json({
      message: `Successfully migrated ${migrated} image URL(s) to Cloudflare target: ${targetPrefix}`,
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
