import { S3Client } from '@aws-sdk/client-s3';

/**
 * Railway Object Storage (S3-compatible) client
 * Uses the bucket credentials from environment variables.
 * Deferred initialization to avoid crashing when env vars are missing at build time.
 */

let _s3: S3Client | null = null;

export function getS3Client(): S3Client {
  if (_s3) return _s3;

  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing S3 environment variables (S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY)');
  }

  _s3 = new S3Client({
    endpoint,
    region: process.env.S3_REGION ?? 'auto',
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });

  return _s3;
}

// Keep backward-compatible export (lazy)
export const s3 = new Proxy({} as S3Client, {
  get(_target, prop) {
    return (getS3Client() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export function getS3Bucket(): string {
  const bucket = process.env.S3_BUCKET_NAME;
  if (!bucket) throw new Error('Missing S3_BUCKET_NAME environment variable');
  return bucket;
}

export const S3_BUCKET = process.env.S3_BUCKET_NAME ?? '';

/**
 * Build the public URL for an object stored in the Railway bucket.
 *
 * Railway buckets are PRIVATE — direct S3 URLs return 403.
 * We route through our own /api/images/ proxy which authenticates server-side.
 */
export function getPublicUrl(key: string): string {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '');
  return `${appUrl}/api/images/${key}`;
}
