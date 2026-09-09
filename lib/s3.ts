import { S3Client } from '@aws-sdk/client-s3';

/**
 * S3 / Cloudflare R2 Client helper
 *
 * Resolves credentials from (in priority order):
 *   1. S3_ENDPOINT / S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY  (custom / Cloudflare R2)
 *   2. AWS_ENDPOINT_URL / AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY  (Railway-injected)
 *
 * Supports endpoint URLs with or without bucket name in path:
 *   e.g. https://c678cf5c0fc5ef3806edacc18e6a762d.r2.cloudflarestorage.com/emochipk
 */

let _s3: S3Client | null = null;

function resolveEnv() {
  const rawEndpoint =
    process.env.S3_ENDPOINT ||
    process.env.AWS_ENDPOINT_URL ||
    process.env.AWS_S3_ENDPOINT_URL;

  const accessKeyId =
    process.env.S3_ACCESS_KEY_ID ||
    process.env.AWS_ACCESS_KEY_ID;

  const secretAccessKey =
    process.env.S3_SECRET_ACCESS_KEY ||
    process.env.AWS_SECRET_ACCESS_KEY;

  const region =
    process.env.S3_REGION ||
    process.env.AWS_DEFAULT_REGION ||
    'auto';

  return { rawEndpoint, accessKeyId, secretAccessKey, region };
}

export function getS3Client(): S3Client {
  if (_s3) return _s3;

  const { rawEndpoint, accessKeyId, secretAccessKey, region } = resolveEnv();

  if (!rawEndpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'Missing S3 credentials. Set S3_ENDPOINT + S3_ACCESS_KEY_ID + S3_SECRET_ACCESS_KEY ' +
      '(or the Railway equivalents: AWS_ENDPOINT_URL + AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY).'
    );
  }

  // Strip any bucket-name path suffix so the SDK gets a clean host endpoint
  // e.g. https://<account>.r2.cloudflarestorage.com/emochipk  →  https://<account>.r2.cloudflarestorage.com
  let endpoint = rawEndpoint;
  try {
    const url = new URL(rawEndpoint);
    if (url.pathname && url.pathname !== '/') {
      endpoint = url.origin;
    }
  } catch (_e) {
    // Keep rawEndpoint as-is if URL parsing fails
  }

  _s3 = new S3Client({
    endpoint,
    region,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });

  return _s3;
}

// Keep backward-compatible export (lazy proxy)
export const s3 = new Proxy({} as S3Client, {
  get(_target, prop) {
    return (getS3Client() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export function getS3Bucket(): string {
  // 1. Explicit bucket name env var
  if (process.env.S3_BUCKET_NAME) return process.env.S3_BUCKET_NAME;
  if (process.env.AWS_S3_BUCKET_NAME) return process.env.AWS_S3_BUCKET_NAME;
  if (process.env.BUCKET) return process.env.BUCKET;

  // 2. Extract from endpoint path e.g. .../emochipk
  const { rawEndpoint } = resolveEnv();
  if (rawEndpoint) {
    try {
      const url = new URL(rawEndpoint);
      const pathBucket = url.pathname.replace(/^\/+|\/+$/g, '');
      if (pathBucket) return pathBucket;
    } catch (_e) {
      // Ignore URL parse errors
    }
  }

  throw new Error(
    'Missing bucket name. Set S3_BUCKET_NAME (or AWS_S3_BUCKET_NAME / BUCKET) env var.'
  );
}

export const S3_BUCKET = process.env.S3_BUCKET_NAME ?? process.env.BUCKET ?? 'emochipk';

/**
 * Build the public URL for an object stored in the bucket.
 * Prioritizes direct Cloudflare R2 delivery (NEXT_PUBLIC_IMAGE_URL / R2_PUBLIC_URL)
 * to achieve 0 egress and 0 Vercel bandwidth usage.
 * Falls back to /api/images/ proxy if no direct CDN domain is configured.
 */
export function getPublicUrl(key: string): string {
  const cleanKey = key.replace(/^\/+/, '');
  const cdnUrl =
    process.env.NEXT_PUBLIC_IMAGE_URL ||
    process.env.NEXT_PUBLIC_CDN_URL ||
    process.env.R2_PUBLIC_URL;

  if (cdnUrl) {
    return `${cdnUrl.replace(/\/$/, '')}/${cleanKey}`;
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://executivemochi.pk').replace(/\/$/, '');
  return `${appUrl}/api/images/${cleanKey}`;
}
