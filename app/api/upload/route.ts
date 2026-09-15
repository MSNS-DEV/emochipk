import { PutObjectCommand } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getS3Client, getS3Bucket, getPublicUrl } from '@/lib/s3';
import crypto from 'crypto';
import path from 'path';

export const dynamic = 'force-dynamic';

/**
 * Validates actual file magic numbers/signatures against allowed image MIME types.
 * Defends against client-spoofed Content-Type headers and malicious uploads.
 */
function detectImageType(buffer: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif' | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4E &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0D &&
    buffer[5] === 0x0A &&
    buffer[6] === 0x1A &&
    buffer[7] === 0x0A
  ) {
    return 'image/png';
  }

  // WebP: 'RIFF' at 0..3 and 'WEBP' at 8..11
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  // AVIF: ISO BMFF ftyp box
  if (buffer.toString('utf8', 4, 8) === 'ftyp') {
    const brand = buffer.toString('utf8', 8, 12);
    if (brand === 'avif' || brand === 'avis' || brand === 'mif1') {
      return 'image/avif';
    }
  }

  return null;
}

const EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
};

export async function POST(request: Request): Promise<NextResponse> {
  // 1. Enforce RBAC Authentication
  const session = await getServerSession(authOptions);
  if (
    !session?.user ||
    (session.user.role !== 'ADMIN' &&
      session.user.role !== 'BRANCH_MANAGER' &&
      session.user.role !== 'WAREHOUSE_STAFF')
  ) {
    return NextResponse.json(
      { error: 'Unauthorized: Staff or Admin privileges required.' },
      { status: 401 }
    );
  }

  // 2. Early env-var check
  const endpoint = process.env.S3_ENDPOINT || process.env.AWS_ENDPOINT_URL;
  const accessKey = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretKey = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKey || !secretKey) {
    return NextResponse.json(
      { error: 'Storage service is not configured. Please contact the system administrator.' },
      { status: 503 }
    );
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
  }

  // Max 10MB file limit
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: 'File too large. Maximum allowed size is 10MB.' },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // 3. Verify real image binary signature (Magic Bytes)
  const detectedType = detectImageType(buffer);
  if (!detectedType) {
    return NextResponse.json(
      { error: 'Invalid file signature. Only valid JPEG, PNG, WebP, and AVIF images are permitted.' },
      { status: 400 }
    );
  }

  try {
    const s3 = getS3Client();
    const bucket = getS3Bucket();

    // 4. Sanitize file name and prevent path traversal
    const safeExtension = EXTENSION_MAP[detectedType] || '.jpg';
    const rawBaseName = path.basename(file.name).replace(/\.[^/.]+$/, '');
    const cleanBaseName = rawBaseName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40) || 'upload';
    const uniqueId = crypto.randomUUID().slice(0, 8);
    const key = `products/${Date.now()}-${uniqueId}-${cleanBaseName}${safeExtension}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: detectedType,
      })
    );

    const url = getPublicUrl(key);
    return NextResponse.json({ url });
  } catch (error) {
    console.error('[upload] S3 upload error:', error);
    const message = error instanceof Error ? error.message : 'Failed to upload file';
    return NextResponse.json(
      { error: `Upload failed: ${message}` },
      { status: 500 }
    );
  }
}
