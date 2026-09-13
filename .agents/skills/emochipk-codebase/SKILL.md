---
name: emochipk-codebase
description: >
  Comprehensive codebase memory for the Executive Mochi (emochipk) e-commerce platform. Use this skill to recall the architecture, database schema, routing, tRPC routers, courier APIs, Cloudflare R2 media policies, Google Merchant Center integrations, and tech stack without having to scan the repository.
---

# Executive Mochi (`emochipk`) Codebase Memory

## Overview
- **Name:** Executive Mochi
- **Domain:** `https://executivemochi.pk`
- **Purpose:** Premium handcrafted footwear & leather accessories e-commerce store with multi-branch inventory, Pakistani courier integrations, customer size memory, and zero-egress media architecture.
- **Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Prisma 6, PostgreSQL (Neon serverless pooler), tRPC v11.
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
  - Prisma Client 6.6 with `@prisma/adapter-pg` and `pg` pool.
  - Hosted on Neon PostgreSQL with pooler connection limit.
- **Authentication:** 
  - NextAuth.js v4.24 (`JWT` session strategy, bcryptjs password hashing).
  - Configured at [`lib/auth.ts`](file:///data/data/com.termux/files/home/emochipk/lib/auth.ts) and [`app/api/auth/[...nextauth]/route.ts`](file:///data/data/com.termux/files/home/emochipk/app/api/auth/[...nextauth]/route.ts).
  - System roles: `CUSTOMER`, `BRANCH_MANAGER`, `ADMIN`, `WAREHOUSE_STAFF`.
- **UI & Styling:**
  - Tailwind CSS 4 (`@tailwindcss/postcss`).
  - Radix UI primitives (Accordion, Dialog, Dropdown, Tabs, Tooltip, Select, Popover, etc.).
  - Sonner toasts, Lucide React icons, Vaul drawers, Embla Carousel.
- **Media & Zero-Egress Storage (Cloudflare R2):**
  - Cloudflare R2 S3-compatible bucket (`emochipk`) via `@aws-sdk/client-s3`.
  - Keys format: `products/<timestamp>-<sanitized_filename>`.
  - Zero-egress rule: Deliver directly via Cloudflare R2 CDN public domain or cached `/api/images/[...key]`. `unoptimized: true` in `next.config.mjs`.

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

4. **Orders & Logistics:**
   - `Order`: Order number, `OrderStatus` (`PENDING`, `PENDING_VERIFICATION`, `VERIFIED`, `PROCESSING`, `PACKED`, `SHIPPED`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`, `RTO`, `RETURNED`), `PaymentMethod` (`COD`, `RAAST`, `JAZZCASH`, `EASYPAISA`, `CARD`, `STORE_CREDIT`, `LOYALTY_POINTS`), `CourierService` (`LEOPARDS`, `POSTEX`, `TRAX`, `PAKISTAN_POST`, `TCS`), `awbNumber`, `trackingNumber`.
   - `OrderItem`: Line items linked to `ProductVariant`.
   - `ShippingAddress`: Recipient address attached to order.
   - `TrackingEvent`: Normalized courier tracking status history.

5. **Customer Care & Returns:**
   - `ReturnRequest`: Return tracking, `ReturnReason`, `ReturnResolution` (`EXCHANGE_SIZE`, `EXCHANGE_PRODUCT`, `STORE_CREDIT`, `REFUND`).
   - `ReturnItem`: Individual variant return rows.
   - `StoreCredit`: Unique voucher codes with expiration and remaining balance.
   - `CartItem` & `WishlistItem`: Persistent carts and saved items.

---

## Routing Structure (Next.js App Router)

### Storefront (`(storefront)/`)
- `/` — Homepage (Hero banners, featured collections, artisan craftsmanship).
- `/shop`, `/shop/[category]` — Catalog filterable by category, style, leather type, size, and price.
- `/product/[slug]` — Product detail page with dynamic variant selectors (UK/US size charts, color swatches).
- `/cart`, `/checkout` — Cart drawer and multi-step Pakistani checkout (COD / digital payment).
- `/order-success` — Order confirmation with conversion tracking (Meta CAPI, Google Customer Reviews opt-in).
- `/track-order` — Live multi-courier tracking lookup.
- `/account/*` — Customer portal: `/orders`, `/addresses`, `/loyalty`, `/credits`, `/sizes`, `/settings`.
- Content pages: `/craftsmanship`, `/size-guide`, `/stores`, `/about`, `/contact`, `/faqs`, `/shipping`, `/returns`, `/privacy`, `/terms`.

### Admin Portal (`(admin)/admin/`)
- `/admin` — High-level KPI dashboard (sales, pending orders, COD verification queues).
- `/admin/products` — Product catalog management, variants, image uploader to R2.
- `/admin/orders` — Order status lifecycle, booking with Leopards/PostEx/Trax, shipping label generation.
- `/admin/inventory` — Multi-branch stock levels, low-stock warnings, branch transfers.
- `/admin/returns` — Return requests, RMA inspections, store credit issuance.
- `/admin/reviews` — Moderation of customer reviews.
- `/admin/branches` — Retail branches management.
- `/admin/users` — Staff permissions and customer administration.

### Branch Portal (`(branch)/branch/`)
- Specialized lightweight portal for local store managers to review localized branch orders and local stock.

---

## API Routes & tRPC Architecture

### tRPC Routers ([`server/root.ts`](file:///data/data/com.termux/files/home/emochipk/server/root.ts))
- `product`: Catalog queries, slug lookup, variant resolution, admin CRUD.
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

### REST Endpoints (`app/api/`)
- `/api/auth/[...nextauth]` — NextAuth authentication handler.
- `/api/trpc/[trpc]` — tRPC HTTP edge handler.
- `/api/images/[...key]` — Edge-cached S3 proxy with immutable headers.
- `/api/upload` — Direct Cloudflare R2 multipart upload endpoint.
- `/api/webhooks/postex` — PostEx automated tracking webhook listener.
- `/api/meta-capi` — Meta Conversions API server-side event tracking.
- `/api/gmc` & `/api/gmc/feed` — Google Merchant Center product XML feed generator.

---

## Logistics & Integrations ([`lib/courier/`](file:///data/data/com.termux/files/home/emochipk/lib/courier))
- **PostEx:** REST integration with automated tracking webhook.
- **Leopards Technology:** Booking API & consignment tracking.
- **Trax:** Booking & status updates.
- **Pakistan Post & TCS:** Standard domestic parcel dispatch adapters.
- **Google Merchant Center:** [`lib/gmc-feed.ts`](file:///data/data/com.termux/files/home/emochipk/lib/gmc-feed.ts), automated product catalog sync via `npm run gmc:sync`.
- **Meta CAPI:** [`lib/meta-capi.ts`](file:///data/data/com.termux/files/home/emochipk/lib/meta-capi.ts), server-side purchase and page view event reporting.

---

## Important Maintenance Commands
- `npm run dev`: Start development server.
- `npm run build`: `prisma generate && next build --webpack`.
- `npm run db:push`: Push Prisma schema to Neon database.
- `npm run db:seed`: Seed base admin and branch data.
- `npm run media:avif`: Batch convert product images to AVIF.
- `npm run media:migrate-cdn`: Migrate old asset URLs to Cloudflare R2 CDN.
- `npm run gmc:sync`: Synchronize active footwear products with Google Merchant Center.
