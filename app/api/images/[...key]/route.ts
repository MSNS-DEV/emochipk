import { GetObjectCommand } from '@aws-sdk/client-s3';
import { NextRequest, NextResponse } from 'next/server';
import { getS3Client, getS3Bucket } from '@/lib/s3';
import path from 'path';

export const dynamic = 'force-dynamic';

const ALLOWED_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);

/**
 * Image proxy route — serves S3/R2 product images with defensive sanitization.
 * Defends against path traversal, arbitrary bucket reading, and Stored XSS.
 *
 * URL format: /api/images/<key>
 * e.g. /api/images/products/1714660000000-shoe.jpg
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
): Promise<NextResponse> {
  const { key: keyParts } = await params;

  if (!keyParts || keyParts.length === 0) {
    return NextResponse.json({ error: 'Missing key' }, { status: 400 });
  }

  // Defend against path traversal: decode and check for traversal patterns
  const decodedParts = keyParts.map((part) => {
    try {
      return decodeURIComponent(part);
    } catch {
      return part;
    }
  });

  for (const part of decodedParts) {
    if (part.includes('..') || part.includes('/') || part.includes('\\') || part.includes('\0')) {
      return NextResponse.json({ error: 'Invalid key path' }, { status: 400 });
    }
  }

  const rawKey = decodedParts.join('/');
  const normalizedKey = path.posix.normalize(rawKey);

  if (normalizedKey.startsWith('..') || path.isAbsolute(normalizedKey)) {
    return NextResponse.json({ error: 'Path traversal detected' }, { status: 400 });
  }

  // Restrict access strictly to the product images prefix
  if (!normalizedKey.startsWith('products/')) {
    return NextResponse.json(
      { error: 'Access denied: Object is outside authorized media directory' },
      { status: 403 }
    );
  }

  try {
    const s3 = getS3Client();
    const bucket = getS3Bucket();

    const response = await s3.send(
      new GetObjectCommand({ Bucket: bucket, Key: normalizedKey })
    );

    if (!response.Body) {
      return NextResponse.json({ error: 'Object not found' }, { status: 404 });
    }

    // Strict MIME-type validation to prevent Stored XSS / MIME confusion attacks
    const rawContentType = response.ContentType?.toLowerCase() || 'image/jpeg';
    const isSafeImage = ALLOWED_CONTENT_TYPES.has(rawContentType);
    const safeContentType = isSafeImage ? rawContentType : 'application/octet-stream';

    // Return 304 Not Modified if client cache ETag matches S3 ETag
    const clientEtag = request.headers.get('if-none-match');
    if (clientEtag && response.ETag && clientEtag === response.ETag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
          'CDN-Cache-Control': 'public, max-age=31536000, immutable',
          'Cloudflare-CDN-Cache-Control': 'public, max-age=31536000, immutable',
          'Vercel-CDN-Cache-Control': 'public, max-age=31536000, immutable',
          'X-Content-Type-Options': 'nosniff',
          'Content-Security-Policy': "default-src 'none'; sandbox",
          'ETag': response.ETag,
        },
      });
    }

    // Convert the readable stream to a Web ReadableStream
    const stream = response.Body.transformToWebStream();

    return new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': safeContentType,
        'Content-Length': response.ContentLength?.toString() ?? '',
        'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
        'CDN-Cache-Control': 'public, max-age=31536000, immutable',
        'Cloudflare-CDN-Cache-Control': 'public, max-age=31536000, immutable',
        'Vercel-CDN-Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; sandbox",
        'ETag': response.ETag ?? '',
      },
    });
  } catch (error: unknown) {
    const err = error as {
      name?: string;
      Code?: string;
      code?: string;
      $metadata?: { httpStatusCode?: number };
    };
    const isNotFound =
      err?.name === 'NoSuchKey' ||
      err?.name === 'NotFound' ||
      err?.Code === 'NoSuchKey' ||
      err?.code === 'NoSuchKey' ||
      err?.$metadata?.httpStatusCode === 404;

    if (isNotFound) {
      return NextResponse.json(
        { error: 'Image not found' },
        {
          status: 404,
          headers: {
            'Cache-Control': 'public, max-age=86400, s-maxage=86400',
          },
        }
      );
    }
    console.error('[image-proxy]', error);
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
  }
}
