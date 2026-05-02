import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

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
export async function POST(): Promise<NextResponse> {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '');
  const bucket = process.env.S3_BUCKET_NAME ?? '';
  const endpoint = (process.env.S3_ENDPOINT ?? '').replace(/\/$/, '');

  if (!appUrl || !bucket || !endpoint) {
    return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
  }

  // Old URL prefix: https://t3.storageapi.dev/optimized-cornucopia-sat3ki/
  const oldPrefix = `${endpoint}/${bucket}/`;
  const newPrefix = `${appUrl}/api/images/`;

  const db = new PrismaClient();

  try {
    // Find all images with old-style URLs
    const images = await db.productImage.findMany({
      where: {
        url: { startsWith: oldPrefix },
      },
      select: { id: true, url: true },
    });

    if (images.length === 0) {
      return NextResponse.json({
        message: 'No images need migration — all URLs are already up to date.',
        migrated: 0,
      });
    }

    // Update each image URL
    let migrated = 0;
    for (const img of images) {
      const key = img.url.replace(oldPrefix, '');
      const newUrl = `${newPrefix}${key}`;
      await db.productImage.update({
        where: { id: img.id },
        data: { url: newUrl },
      });
      migrated++;
    }

    return NextResponse.json({
      message: `Successfully migrated ${migrated} image URL(s) from direct S3 to proxy format.`,
      migrated,
      sample: images.slice(0, 3).map((img) => ({
        old: img.url,
        new: `${newPrefix}${img.url.replace(oldPrefix, '')}`,
      })),
    });
  } catch (error) {
    console.error('[migrate-image-urls]', error);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  } finally {
    await db.$disconnect();
  }
}
