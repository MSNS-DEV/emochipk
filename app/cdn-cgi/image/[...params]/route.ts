import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getS3Client, getS3Bucket } from '@/lib/s3';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

const ALLOWED_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/svg+xml',
  'image/x-icon',
  'image/vnd.microsoft.icon',
]);

const EXTENSION_MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

/**
 * Parses comma-separated Cloudflare Image transformation options.
 * Example: width=800,quality=80,format=auto,fit=scale-down,metadata=none
 */
function parseTransformOptions(rawOptions: string): {
  width?: number;
  quality?: number;
  format?: string;
} {
  const result: { width?: number; quality?: number; format?: string } = {};
  const pairs = rawOptions.split(',');
  for (const pair of pairs) {
    const [k, v] = pair.split('=');
    if (!k || !v) continue;
    const key = k.trim().toLowerCase();
    const val = v.trim().toLowerCase();
    if (key === 'width' || key === 'w') {
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed) && parsed > 0 && parsed <= 3840) result.width = parsed;
    } else if (key === 'quality' || key === 'q') {
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed) && parsed > 0 && parsed <= 100) result.quality = parsed;
    } else if (key === 'format' || key === 'f') {
      result.format = val;
    }
  }
  return result;
}

/**
 * Edge-compatible fallback handler for Cloudflare Image Resizing (/cdn-cgi/image/...).
 *
 * In production behind a Cloudflare proxy:
 * Cloudflare Edge intercepts this path and applies edge transcoding/resizing directly.
 *
 * In local development, preview builds, or origin fallbacks:
 * This route parses transformation options, retrieves source image buffers (from local
 * public static storage or Cloudflare R2 bucket), dynamically applies Sharp resizing
 * when available, and sets 1-year immutable edge caching headers.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ params: string[] }> }
): Promise<NextResponse> {
  const { params: pathSegments } = await params;

  if (!pathSegments || pathSegments.length < 2) {
    return NextResponse.json({ error: 'Missing image transformation parameters or source' }, { status: 400 });
  }

  const [rawOptions, ...sourceSegments] = pathSegments;
  const options = parseTransformOptions(rawOptions);

  // Reconstruct target image path or URL
  let targetPath = sourceSegments.join('/');

  // If source was an absolute URL encoded in the path (e.g. https:/executivemochi.pk/...)
  if (sourceSegments[0] === 'http:' || sourceSegments[0] === 'https:') {
    const protocol = sourceSegments[0];
    const rest = sourceSegments.slice(1).filter(Boolean).join('/');
    targetPath = `${protocol}//${rest}`;
  }

  // Defend against directory traversal
  if (targetPath.includes('..') || targetPath.includes('\0')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const clientEtag = request.headers.get('if-none-match');
  let rawBuffer: Buffer | null = null;
  let rawContentType = 'image/jpeg';
  let responseEtag = '';

  // ── Step 1: Check if source corresponds to a local file in /public ───────
  const publicDir = path.resolve(process.cwd(), 'public');
  let cleanRelPath = targetPath.replace(/^\/+/, '').split('?')[0];

  // If an absolute URL to the current origin was passed, extract relative pathname
  try {
    if (targetPath.startsWith('http://') || targetPath.startsWith('https://')) {
      const parsedUrl = new URL(targetPath);
      cleanRelPath = parsedUrl.pathname.replace(/^\/+/, '');
    }
  } catch {
    // Relative path, keep cleanRelPath
  }

  const candidateLocalPaths: string[] = [
    path.resolve(publicDir, cleanRelPath),
  ];

  // If referencing /api/images/products/... or products/..., check public/images/products/
  if (cleanRelPath.includes('api/images/')) {
    const subKey = cleanRelPath.substring(cleanRelPath.indexOf('api/images/') + 'api/images/'.length);
    candidateLocalPaths.push(path.resolve(publicDir, 'images', subKey));
    candidateLocalPaths.push(path.resolve(publicDir, subKey));
  } else if (cleanRelPath.startsWith('products/')) {
    candidateLocalPaths.push(path.resolve(publicDir, 'images', cleanRelPath));
  }

  for (const candidate of candidateLocalPaths) {
    if (candidate.startsWith(publicDir) && fs.existsSync(candidate)) {
      try {
        const stat = fs.statSync(candidate);
        if (stat.isFile()) {
          const ext = path.extname(candidate).toLowerCase();
          rawContentType = EXTENSION_MIME_MAP[ext] || 'image/jpeg';
          responseEtag = `W/"${stat.size}-${Math.floor(stat.mtimeMs)}"`;

          if (clientEtag && clientEtag === responseEtag) {
            return new NextResponse(null, {
              status: 304,
              headers: {
                'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
                'Cloudflare-CDN-Cache-Control': 'public, max-age=31536000, immutable',
                'CDN-Cache-Control': 'public, max-age=31536000, immutable',
                'Vercel-CDN-Cache-Control': 'public, max-age=31536000, immutable',
                'ETag': responseEtag,
              },
            });
          }

          rawBuffer = fs.readFileSync(candidate);
          break;
        }
      } catch {
        // Continue checking other candidates or fallback to S3
      }
    }
  }

  // ── Step 2: If not found on local disk, resolve from S3/R2 ────────────────
  if (!rawBuffer) {
    let s3Key = cleanRelPath;
    if (s3Key.includes('api/images/')) {
      s3Key = s3Key.substring(s3Key.indexOf('api/images/') + 'api/images/'.length);
    } else if (s3Key.startsWith('images/products/')) {
      s3Key = s3Key.substring('images/'.length);
    }

    s3Key = path.posix.normalize(s3Key).replace(/^\/+/, '');

    // Media proxy security: only allow products/ directory for S3/R2 assets
    if (!s3Key.startsWith('products/')) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404, headers: { 'Cache-Control': 'public, max-age=300' } }
      );
    }

    try {
      const s3 = getS3Client();
      const bucket = getS3Bucket();

      const s3Response = await s3.send(
        new GetObjectCommand({ Bucket: bucket, Key: s3Key })
      );

      if (!s3Response.Body) {
        return NextResponse.json(
          { error: 'Image not found' },
          { status: 404, headers: { 'Cache-Control': 'public, max-age=300' } }
        );
      }

      if (clientEtag && s3Response.ETag && clientEtag === s3Response.ETag) {
        return new NextResponse(null, {
          status: 304,
          headers: {
            'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
            'Cloudflare-CDN-Cache-Control': 'public, max-age=31536000, immutable',
            'CDN-Cache-Control': 'public, max-age=31536000, immutable',
            'Vercel-CDN-Cache-Control': 'public, max-age=31536000, immutable',
            'ETag': s3Response.ETag,
          },
        });
      }

      responseEtag = s3Response.ETag ?? '';
      rawContentType = s3Response.ContentType?.toLowerCase() || 'image/jpeg';

      const stream = s3Response.Body.transformToWebStream();
      const reader = stream.getReader();
      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }
      rawBuffer = Buffer.concat(chunks);
    } catch (error: unknown) {
      const err = error as { name?: string; Code?: string; code?: string; $metadata?: { httpStatusCode?: number } };
      const isNotFound =
        err?.name === 'NoSuchKey' ||
        err?.name === 'NotFound' ||
        err?.Code === 'NoSuchKey' ||
        err?.code === 'NoSuchKey' ||
        err?.$metadata?.httpStatusCode === 404;

      if (isNotFound) {
        return NextResponse.json(
          { error: 'Image not found' },
          { status: 404, headers: { 'Cache-Control': 'public, max-age=300' } }
        );
      }

      console.error('[cloudflare-image-route] S3 fetch error:', error);
      return NextResponse.json({ error: 'Failed to retrieve image' }, { status: 500 });
    }
  }

  if (!rawBuffer) {
    return NextResponse.json(
      { error: 'Image not found' },
      { status: 404, headers: { 'Cache-Control': 'public, max-age=300' } }
    );
  }

  // ── Step 3: Optimize / Resize via Sharp if supported in runtime ──────────
  let finalContentType = ALLOWED_CONTENT_TYPES.has(rawContentType) ? rawContentType : 'image/jpeg';
  let outputBuffer: Buffer = rawBuffer;

  // Don't attempt to rasterize or resize SVGs or ICOs
  if (finalContentType !== 'image/svg+xml' && !finalContentType.includes('icon')) {
    try {
      const sharpModule = await import('sharp').catch(() => null);
      const sharpFactory = ((sharpModule as any)?.default ?? sharpModule) as any;
      if (typeof sharpFactory === 'function') {
        let pipeline = sharpFactory(rawBuffer).rotate();
        if (options.width) {
          pipeline = pipeline.resize({
            width: options.width,
            fit: 'inside',
            withoutEnlargement: true,
          });
        }
        const quality = options.quality || 80;
        const acceptHeader = request.headers.get('accept') || '';
        if (options.format === 'avif' || (!options.format && acceptHeader.includes('image/avif'))) {
          outputBuffer = await pipeline.avif({ quality, effort: 4 }).toBuffer();
          finalContentType = 'image/avif';
        } else {
          outputBuffer = await pipeline.webp({ quality, effort: 4 }).toBuffer();
          finalContentType = 'image/webp';
        }
      }
    } catch {
      // Gracefully fall back to original buffer if Sharp is unavailable or unsupported
    }
  }

  return new NextResponse(outputBuffer, {
    status: 200,
    headers: {
      'Content-Type': finalContentType,
      'Content-Length': outputBuffer.length.toString(),
      'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
      'Cloudflare-CDN-Cache-Control': 'public, max-age=31536000, immutable',
      'CDN-Cache-Control': 'public, max-age=31536000, immutable',
      'Vercel-CDN-Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'ETag': responseEtag,
    },
  });
}
