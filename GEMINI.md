# Executive Mochi — Project Rules & Guidelines

## 1. Database & ORM (Vercel Prisma Postgres)
- **Primary Database:** Hosted on Vercel Prisma Postgres (`emochipkdb`) at `db.prisma.io:5432/postgres`.
- **Driver Architecture:** Always connect using `@prisma/adapter-pg` backed by a native `pg.Pool` connection pooler configured in [`server/db.ts`](file:///data/data/com.termux/files/home/emochipk/server/db.ts).
- **Environment Variables:** Both `DATABASE_URL` and `DIRECT_URL` point to the Vercel Prisma Postgres instance.

## 2. Media Storage & Zero-Egress Delivery (Cloudflare R2)
- **Storage Provider:**
  - All product images, media assets, and user uploads MUST be stored exclusively in Cloudflare R2 (`emochipk` bucket) via `@aws-sdk/client-s3`.
  - Never use Vercel Blob (`@vercel/blob`) or secondary media storage providers.
  - All image keys MUST follow the `products/<timestamp>-<sanitized_filename>` convention.
- **Zero-Egress & Minimal Vercel Bandwidth Rules:**
  - Do not route heavy binary media through Vercel serverless compute.
  - Deliver media directly via Cloudflare R2 public domain or CDN cache.
  - Any fallback image proxy route (`/api/images/[...key]`) MUST send immutable CDN caching headers (`Cache-Control: public, max-age=31536000, s-maxage=31536000, immutable`).
- **Next.js Image Optimization:**
  - Maintain `images: { unoptimized: true }` in `next.config.mjs` for remote R2 images.
  - Media pre-optimization should be done ahead-of-time (e.g. `npm run media:avif`) to store lightweight AVIF/WebP assets directly in Cloudflare R2.

## 3. Storefront Photo Gating Policy
- **Gating Enforcement:** All customer-facing catalog queries (`/shop`, `/`, and related products on `/product/[slug]`) MUST pass `hasImages: true` to `api.product.getAll`.
- **Inventory Preservation:** Do not delete unphotographed ERP inventory from the database; keep `images: { some: {} }` opt-in in `server/routers/product.ts` so admin tools and diagnostic scripts retain full visibility.

## 4. Digital Card Payments & Bank BIN Discounts
- **PCI-DSS SAQ-A Compliance:** Never capture, transmit, or store raw cardholder PAN or CVV numbers on the application server. Use Safepay Hosted Checkout and tokenized tracker IDs.
- **Dynamic BIN Evaluation:** Evaluate only the first 6 digits (`lib/payment/bin-lookup.ts`) against active `BankDiscountCampaign` records (e.g. HBL, Bank Alfalah, Meezan Bank, Standard Chartered).
- **Cryptographic Webhooks:** All incoming payment webhooks at `/api/webhooks/safepay` MUST be verified using HMAC-SHA256 with length-guarded `crypto.timingSafeEqual`.

## 5. Background Scheduled Automation & Cron Security
- **Endpoints:** All scheduled tasks reside in [`app/api/cron/`](file:///data/data/com.termux/files/home/emochipk/app/api/cron/):
  - `courier-sync` (`0 */2 * * *`): Bi-hourly tracking sync with PostEx/TCS/Leopards.
  - `inventory-cleanup` (`*/30 * * * *`): Releases temporary holds on abandoned checkouts.
  - `gmc-sync` (`0 0 * * *`): Daily Google Merchant Center catalog sync.
  - `credit-expiry` (`0 1 * * *`): Daily store credit voucher expiry audit.
  - `sitemap-ping` (`0 3 * * 0`): Weekly sitemap and Generative AI `llms.txt` freshness check.
- **Security Standard (FR-CRN-08):** All `/api/cron/*` endpoints MUST validate `Authorization: Bearer ${CRON_SECRET}` via [`lib/cron-auth.ts`](file:///data/data/com.termux/files/home/emochipk/lib/cron-auth.ts).
- **Execution Limits:** Set `export const maxDuration = 60` for serverless timeouts.
