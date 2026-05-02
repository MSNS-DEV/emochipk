import { GetObjectCommand } from '@aws-sdk/client-s3';
import { NextRequest, NextResponse } from 'next/server';
import { getS3Client, getS3Bucket } from '@/lib/s3';

/**
 * Image proxy route — serves Railway S3 objects through the app.
 * Railway buckets are PRIVATE, so we authenticate server-side and stream
 * the bytes to the browser with aggressive caching headers.
 *
 * URL format: /api/images/<key>
 * e.g. /api/images/products/1714660000000-shoe.jpg
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
): Promise<NextResponse> {
  const { key: keyParts } = await params;
  const key = keyParts.join('/');

  if (!key) {
    return NextResponse.json({ error: 'Missing key' }, { status: 400 });
  }

  try {
    const s3 = getS3Client();
    const bucket = getS3Bucket();

    const response = await s3.send(
      new GetObjectCommand({ Bucket: bucket, Key: key })
    );

    if (!response.Body) {
      return NextResponse.json({ error: 'Object not found' }, { status: 404 });
    }

    // Convert the readable stream to a Web ReadableStream
    const stream = response.Body.transformToWebStream();

    return new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': response.ContentType ?? 'application/octet-stream',
        'Content-Length': response.ContentLength?.toString() ?? '',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'ETag': response.ETag ?? '',
      },
    });
  } catch (error: unknown) {
    const code = (error as { name?: string })?.name;
    if (code === 'NoSuchKey' || code === 'NotFound') {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }
    console.error('[image-proxy]', error);
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
  }
}
