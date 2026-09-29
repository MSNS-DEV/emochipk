---
name: emochipk-codebase
description: >
  Comprehensive codebase memory for the Executive Mochi (emochipk) e-commerce platform. Use this skill to recall the architecture, database schema, routing, tRPC routers, courier APIs, Cloudflare R2 media policies, Google Merchant Center integrations, payment gateway architecture, and tech stack without having to scan the repository.
---

# Executive Mochi (`emochipk`) Codebase Memory

## Overview
- **Name:** Executive Mochi
- **Domain:** `https://executivemochi.pk`
- **Purpose:** Premium handcrafted footwear & leather accessories e-commerce store with multi-branch inventory, Pakistani courier integrations, dynamic bank card BIN discount engine, customer size memory, and zero-egress media architecture.
- **Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Prisma 6, PostgreSQL (Vercel Prisma Postgres `emochipkdb`), tRPC v11.
- **Package Manager:** npm.

---

## Technology Stack & Architecture

- **Framework:** Next.js 16.2 (App Router with `@next/swc-wasm-nodejs`, webpack build mode).
- **Frontend / React:** React 19.2, `@types/react` 19.
- **API & Data Layer:** 
  - tRPC v11 (`@trpc/server`, `@trpc/client`, `@trpc/react-query`).
  - TanStack React Query v5.
  - SuperJSON for serialization.
  - Zod 3.24 for runtime schema validations.
- **Database & ORM:** 
  - Prisma Client 6.6 with `@prisma/adapter-pg` and `pg.Pool`.
  - Hosted on Vercel Prisma Postgres (`emochipkdb`) at `db.prisma.io:5432/postgres`.
- **Authentication:** 
  - NextAuth.js v4.24 (`JWT` session strategy, bcryptjs password hashing).
  - Configured at [`lib/auth.ts`](file:///data/data/com.termux/files/home/emochipk/lib/auth.ts) and [`app/api/auth/[...nextauth]/route.ts`](file:///data/data/com.termux/files/home/emochipk/app/api/auth/[...nextauth]/route.ts).
  - System roles: `CUSTOMER`, `BRANCH_MANAGER`, `ADMIN`, `WAREHOUSE_STAFF`.
- **UI & Styling:**
  - Tailwind CSS 4 (`@tailwindcss/postcss`).
  - Radix UI primitives (Accordion, Dialog, Dropdown, Tabs, Tooltip, Select, Popover, etc.).
  - Sonner toasts, Lucide React icons, Vaul drawers, Embla Carousel.
- **Brand Assets & Favicon Architecture:**
  - High-resolution uncompressed 256×256 PNG at `public/logo.png`, `public/apple-icon.png`, `app/apple-icon.png`, and `app/icon.png`.
  - Windows ICO format preserved at `public/favicon.ico` and `app/favicon.ico`.
  - All navigation headers, footers, and Next.js App Router metadata `icons` reference `/logo.png` and `/favicon.ico` directly to avoid ICO rendering bugs across mobile and Safari.
- **Media, Zero-Egress Storage & Image Invariants:**
  - Cloudflare R2 S3-compatible bucket (`emochipk`) via `@aws-sdk/client-s3`.
  - Keys format: `products/<timestamp>-<sanitized_filename>`.
  - Zero-egress rule: Deliver directly via Cloudflare R2 CDN public domain or cached `/api/images/[...key]`. `unoptimized: true` in `next.config.mjs`.
  - Storefront Photo Gating: Catalog listing queries (`/shop`, `/`, PDP related products) enforce `hasImages: true` by default to suppress unphotographed legacy ERP items.
  - Primary Image Invariant: Every photographed product (343 photographed models, 756 linked images in PostgreSQL) maintains exactly one `isPrimary = true` record in `product_images`.
  - Admin Photo Ingestion: `scripts/sync-admin-uploaded-images.mjs` links unlinked R2 objects to their respective products and recalibrates primary flags.
  - Cross-Category Leakage Prevention: Shop cover marquees and category slideshows must scope fallback queries to the active category or featured items to prevent single images from dominating all category banners.
- **Storefront Component Architecture:**
  - `ProductShelf` (`components/product-shelf.tsx`): Kinetic touch and mouse-drag horizontal carousel with edge fading gradients, dynamic card snapping (disabled during active drag to eliminate jitter), desktop navigation chevrons, and keyboard arrow controls.
  - `ProductCard` (`components/product-card.tsx`): Luxury interaction pattern (direct navigation to `/product/[slug]`), interactive color swatches with active ring, case-insensitive `colorTag` matching, wishlist toasts, and craftsmanship highlights ("Handcrafted in Pasrur & Ghakhar").
  - `CategorySlideshow` (`components/category-slideshow.tsx`): Caps slide pool to 10 images, mounts only active and adjacent slides for low memory, and randomizes post-mount to eliminate SSR hydration mismatches.

---

## Database Models ([`prisma/schema.prisma`](file:///data/data/com.termux/files/home/emochipk/prisma/schema.prisma))

1. **User & Accounts:**
   - `User`: Base credentials (email, password bcrypt, name, phone, `UserRole`, `isActive`).
   - `Customer`: Profile linked to `User`, `LoyaltyTier` (`BRONZE`, `SILVER`, `GOLD`), `loyaltyPoints`.
   - `BranchManager`: Maps `User` to a specific `Branch`.
   - `Address`: Shipping addresses with default flags.
   - `SizePreference`: Per-customer shoe size memory (`Style`, `sizeUK`, `Width`).

2. **Catalog & Footwear Taxonomy:**
   - `Product`: Article number (e.g. `EM-001`), name, slug, description, `basePrice`, `salePrice`, `ProductCategory` (`MEN`, `WOMEN`, `KIDS`, `ACCESSORIES`), `Occasion[]`, `Style`, `LeatherType`, `manufacturingCity` (Pasrur, Daska, Imported).
   - `ProductVariant`: SKU (`[ARTICLE]-[COLOR]-[SIZE]-[WIDTH]`), `sizeUK`, `sizeUS`, `sizeEU`, `sizeCM`, `color`, `colorHex`, `width` (`STANDARD`, `WIDE`, `EXTRA_WIDE`), `priceDelta`.
   - `ProductImage`: `url`, `altText`, `isPrimary`, `colorTag`, `sortOrder`.
   - `Review`: Rating (1–5), approval flag, customer & product relation.

3. **Multi-Branch Inventory & Operations:**
   - `Branch`: Physical shops & distribution hubs (e.g., Pasrur, Daska).
   - `Inventory`: Compound key `@@unique([branchId, variantId])`, tracks `quantity`, `reserved`, `lowStockThreshold`.
   - `InventoryTransaction`: Audit log (`SALE`, `TRANSFER_OUT`, `TRANSFER_IN`, `RETURN`, `ADJUSTMENT`, `RESTOCK`, `DAMAGE_WRITE_OFF`).
   - `StockTransfer` & `StockTransferItem`: Inter-branch inventory dispatch & receipt tracking.
   - `StockAdjustment`: Manual stock corrections or damage write-offs with reason & notes.

4. **Orders & Digital Payments:**
   - `Order`: Order number, `OrderStatus` (`PENDING`, `PENDING_VERIFICATION`, `VERIFIED`, `PROCESSING`, `PACKED`, `SHIPPED`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`, `RTO`, `RETURNED`), `PaymentMethod` (`COD`, `RAAST`, `JAZZCASH`, `EASYPAISA`, `CARD`, `STORE_CREDIT`, `LOYALTY_POINTS`), `PaymentStatus` (`UNPAID`, `PAID_DIGITAL`, `COD_PENDING_COLLECTION`, `COD_SETTLED_BY_COURIER`, `REFUNDED`), `CourierService` (`LEOPARDS`, `POSTEX`, `TRAX`, `PAKISTAN_POST`, `TCS`), `awbNumber`, `trackingNumber`.
   - `OrderItem`: Line items linked to `ProductVariant`.
   - `ShippingAddress`: Recipient address attached to order.
   - `TrackingEvent`: Normalized courier tracking status history.
   - `PaymentTransaction`: PCI-DSS SAQ-A compliant tokenized transaction audit log (`transactionReference`, `amount`, `status`, `cardScheme`, `cardLast4`, `cardBin`, `issuingBank`, `gatewayRawResponse`).
   - `BankDiscountCampaign`: Bank partnership BIN discounts (`issuingBank`, `binPrefixes`, `discountType`, `discountValue`, `maxDiscountCap`, `minimumOrderAmount`, `isActive`).

5. **Customer Care & Returns:**
   - `ReturnRequest`: Return tracking, `ReturnReason`, `ReturnResolution` (`EXCHANGE_SIZE`, `EXCHANGE_PRODUCT`, `STORE_CREDIT`, `REFUND`).
   - `ReturnItem`: Individual variant return rows.
   - `StoreCredit`: Unique voucher codes with expiration and remaining balance.
   - `CartItem` & `WishlistItem`: Persistent carts and saved items.

---

## Routing Structure (Next.js App Router)

### Storefront (`(storefront)/`)
- `/` — Homepage (Hero banners, curated footwear collections, craftsmanship spotlight).
- `/shop`, `/shop/[category]` — Filterable catalog (category, style, leather, size, and "With Photos Only 📸").
- `/product/[slug]` — Product detail page with dynamic variant selectors (UK/US size charts, color swatches).
- `/cart`, `/checkout` — Cart drawer and Pakistani checkout with real-time Bank BIN detection (HBL, Alfalah, Meezan, SCB) and Safepay 3DS card session generation.
- `/order-success` — Order confirmation with conversion tracking (Meta CAPI, Google Customer Reviews opt-in).
- `/track-order` — Live multi-courier tracking lookup.
- `/account/*` — Customer portal: `/orders`, `/addresses`, `/loyalty`, `/credits`, `/sizes`, `/settings`.

### Admin Portal (`(admin)/admin/`)
- `/admin` — High-level KPI dashboard (sales, pending orders, COD verification queues).
- `/admin/products` — Product catalog management, variants, image uploader to R2.
- `/admin/orders` — Order status lifecycle, booking with Leopards/PostEx/Trax, shipping label generation.
- `/admin/inventory` — Multi-branch stock levels, low-stock warnings, branch transfers.
- `/admin/returns` — Return requests, RMA inspections, store credit issuance.
- `/admin/reviews` — Moderation of customer reviews.
- `/admin/branches` — Retail branches management.
- `/admin/users` — Staff permissions and customer administration.

---

## API Routes & tRPC Architecture

### tRPC Routers ([`server/root.ts`](file:///data/data/com.termux/files/home/emochipk/server/root.ts))
- `product`: Catalog queries, slug lookup, variant resolution, admin CRUD.
- `payment`: Card session initiation (`initiateCardSession`), real-time BIN evaluation (`lookupBin`), active campaigns (`getActiveCampaigns`).
- `branch`: Branch listings and metadata.
- `inventory`: Branch-specific inventory queries, adjustments, transfers.
- `order`: Checkout creation, customer order history, admin status transitions.
- `cart`: Persistent cart sync.
- `customer`: Customer profile, saved addresses, size preferences.
- `wishlist`: Wishlist toggle & fetch.
- `returns`: Return request lifecycle.
- `review`: Submission and moderation.
- `user`: User accounts and roles.
- `courier`: Courier booking, label generation, and rate queries.
- `googleMerchant`: Product feed sync & catalog validation.

### Background Automation Cron Endpoints (`app/api/cron/` — SRS Section 3.10)
- `/api/cron/courier-sync` (`0 */2 * * *`): Bi-hourly tracking sync with PostEx, TCS, Leopards, and Pakistan Post.
- `/api/cron/inventory-cleanup` (`*/30 * * * *`): 30-minute release of temporary holds on abandoned checkouts.
- `/api/cron/gmc-sync` (`0 0 * * *`): Daily midnight UTC catalog sync with Google Merchant Center.
- `/api/cron/credit-expiry` (`0 1 * * *`): Daily voucher expiration audit.
- `/api/cron/sitemap-ping` (`0 3 * * 0`): Weekly sitemap validation and search engine indexation ping.
- *Security:* All cron routes are secured with `Authorization: Bearer ${CRON_SECRET}` via [`lib/cron-auth.ts`](file:///data/data/com.termux/files/home/emochipk/lib/cron-auth.ts).

### REST Endpoints (`app/api/`)
- `/api/auth/[...nextauth]` — NextAuth authentication handler.
- `/api/trpc/[trpc]` — tRPC HTTP edge handler.
- `/api/images/[...key]` — Edge-cached S3 proxy with immutable headers.
- `/api/upload` — Direct Cloudflare R2 multipart upload endpoint.
- `/api/webhooks/safepay` — Cryptographic HMAC-SHA256 Safepay 3DS webhook handler.
- `/api/webhooks/postex` — PostEx automated tracking webhook listener.
- `/api/meta-capi` — Meta Conversions API server-side event tracking.
- `/api/gmc` & `/api/gmc/feed` — Google Merchant Center product XML feed generator.

---

## Logistics, Payments & Integrations
- **Safepay & Pakistani Bank Alliances:** [`lib/payment/safepay.ts`](file:///data/data/com.termux/files/home/emochipk/lib/payment/safepay.ts), [`lib/payment/bin-lookup.ts`](file:///data/data/com.termux/files/home/emochipk/lib/payment/bin-lookup.ts). Active BIN campaigns for HBL (15%), Alfalah (10%), Meezan (10%), and SCB (15%).
- **PostEx, TCS, Leopards, Pakistan Post:** [`lib/courier/`](file:///data/data/com.termux/files/home/emochipk/lib/courier).
- **Google Merchant Center:** [`lib/google-merchant.ts`](file:///data/data/com.termux/files/home/emochipk/lib/google-merchant.ts), [`lib/gmc-feed.ts`](file:///data/data/com.termux/files/home/emochipk/lib/gmc-feed.ts).
- **Meta CAPI:** [`lib/meta-capi.ts`](file:///data/data/com.termux/files/home/emochipk/lib/meta-capi.ts).

---

## Important Maintenance Commands
- `npm run dev`: Start development server.
- `npm run build`: `prisma generate && next build --webpack`.
- `npm run db:push`: Push Prisma schema to Vercel Prisma Postgres.
- `npm run db:seed`: Seed base admin, branch, and bank campaign data.
- `npm run gmc:sync`: Synchronize active footwear products with Google Merchant Center.
