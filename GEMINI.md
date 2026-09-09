# Executive Mochi — Project Rules & Guidelines

## Media Storage & Zero-Egress Delivery (Cloudflare R2)

1. **Storage Provider**:
   - All product images, media assets, and user uploads MUST be stored exclusively in Cloudflare R2 (`emochipk` bucket) via `@aws-sdk/client-s3`.
   - Never use Vercel Blob (`@vercel/blob`) or any secondary media storage provider.
   - All image keys MUST follow the `products/<timestamp>-<sanitized_filename>` convention.

2. **Zero-Egress & Minimal Vercel Bandwidth Rules**:
   - **Do not route heavy binary media through Vercel serverless compute**.
   - Deliver media directly via Cloudflare R2 public domain (e.g. `images.executivemochi.pk` or `pub-*.r2.dev`) using `NEXT_PUBLIC_IMAGE_URL`.
   - Any fallback image proxy route (`/api/images/[...key]`) MUST send aggressive CDN caching headers (`Cache-Control: public, max-age=31536000, s-maxage=31536000, immutable` and `Cloudflare-CDN-Cache-Control`) so that Cloudflare's Edge CDN caches and serves the image on the first hit, avoiding repetitive Vercel Fast Data Transfer and serverless execution.

3. **Next.js Image Optimization**:
   - Maintain `images: { unoptimized: true }` in `next.config.mjs` for remote R2 images.
   - Do NOT run on-demand serverless image optimization (`/_next/image`) on Vercel for catalog images.
   - Media pre-optimization should be done ahead-of-time (e.g. `npm run media:avif`) to store lightweight AVIF/WebP assets directly in Cloudflare R2.
