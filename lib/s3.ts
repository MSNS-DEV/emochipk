import { S3Client } from '@aws-sdk/client-s3';

/**
 * Railway Object Storage (S3-compatible) client
 * Uses the bucket credentials from environment variables.
 */
export const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT!,
  region: process.env.S3_REGION ?? 'auto',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  // Railway storage requires path-style access
  forcePathStyle: true,
});

export const S3_BUCKET = process.env.S3_BUCKET_NAME!;

/**
 * Build the public URL for an object stored in the Railway bucket.
 */
export function getPublicUrl(key: string): string {
  const endpoint = process.env.S3_ENDPOINT!.replace(/\/$/, '');
  return `${endpoint}/${S3_BUCKET}/${key}`;
}
