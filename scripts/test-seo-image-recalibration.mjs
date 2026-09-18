import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// ─────────────────────────────────────────────────────────────────────────────
// 1. Cloudflare Image Loader Verification
// ─────────────────────────────────────────────────────────────────────────────
test('Cloudflare Image Loader properly structures transform parameters and normalizes same-origin URLs', async () => {
  const { default: cloudflareLoader } = await import(
    path.join(rootDir, 'lib/cloudflare-image-loader.ts')
  );

  // Test 1: Relative API image path
  const relResult = cloudflareLoader({
    src: '/api/images/products/test-shoe.jpg',
    width: 640,
    quality: 80,
  });
  assert.equal(
    relResult,
    '/cdn-cgi/image/width=640,quality=80,format=auto,fit=scale-down,metadata=none/api/images/products/test-shoe.jpg'
  );

  // Test 2: Same-origin absolute URL normalized to relative zone path (prevents Cloudflare error 9403)
  const sameOriginResult = cloudflareLoader({
    src: 'https://executivemochi.pk/api/images/products/oxford.jpg',
    width: 1080,
    quality: 85,
  });
  assert.equal(
    sameOriginResult,
    '/cdn-cgi/image/width=1080,quality=85,format=auto,fit=scale-down,metadata=none/api/images/products/oxford.jpg'
  );

  // Test 3: External absolute URL preserved
  const externalResult = cloudflareLoader({
    src: 'https://cdn.example.com/assets/shoe.jpg',
    width: 800,
    quality: 75,
  });
  assert.equal(
    externalResult,
    '/cdn-cgi/image/width=800,quality=75,format=auto,fit=scale-down,metadata=none/https://cdn.example.com/assets/shoe.jpg'
  );

  // Test 4: Default quality when omitted
  const defaultQResult = cloudflareLoader({
    src: '/images/hero.jpg',
    width: 1200,
  });
  assert.ok(defaultQResult.includes('quality=80'), 'Should default to quality 80');
  assert.ok(defaultQResult.includes('format=auto'), 'Should include format=auto');
  assert.ok(defaultQResult.includes('fit=scale-down'), 'Should include fit=scale-down');
  assert.ok(defaultQResult.includes('metadata=none'), 'Should include metadata=none');

  // Test 5: SVGs, Data URIs, and already-transformed URLs bypassed
  assert.equal(
    cloudflareLoader({ src: 'data:image/png;base64,123', width: 100 }),
    'data:image/png;base64,123'
  );
  assert.equal(
    cloudflareLoader({ src: '/icons/logo.svg', width: 200 }),
    '/icons/logo.svg'
  );
  assert.equal(
    cloudflareLoader({ src: '/cdn-cgi/image/width=400/test.jpg', width: 400 }),
    '/cdn-cgi/image/width=400/test.jpg'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Cloudflare Image Route Handler Deep Execution Verification
// ─────────────────────────────────────────────────────────────────────────────
test('Cloudflare Image route handler successfully serves local public assets and guards against traversal', async () => {
  const route = await import(path.join(rootDir, 'app/cdn-cgi/image/[...params]/route.ts'));
  const { NextRequest } = await import('next/server');

  // Subtest 1: Local public image serving
  const req1 = new NextRequest('http://localhost:3000/cdn-cgi/image/width=640,quality=80/images/hero-shoes.jpg');
  const res1 = await route.GET(req1, {
    params: Promise.resolve({ params: ['width=640,quality=80', 'images', 'hero-shoes.jpg'] }),
  });
  assert.equal(res1.status, 200, 'Must serve existing local public image with 200 OK');
  assert.equal(res1.headers.get('content-type'), 'image/jpeg');
  assert.ok(res1.headers.get('cache-control')?.includes('immutable'), 'Must set immutable cache headers');
  assert.ok(res1.headers.get('etag'), 'Must supply an ETag header');

  // Subtest 2: Local catalog product image serving
  const req2 = new NextRequest('http://localhost:3000/cdn-cgi/image/width=640,quality=80/images/products/oxford-black-1.jpg');
  const res2 = await route.GET(req2, {
    params: Promise.resolve({ params: ['width=640,quality=80', 'images', 'products', 'oxford-black-1.jpg'] }),
  });
  assert.equal(res2.status, 200, 'Must serve catalog product image with 200 OK');

  // Subtest 3: Path traversal defense
  const req3 = new NextRequest('http://localhost:3000/cdn-cgi/image/width=640/../../etc/passwd');
  const res3 = await route.GET(req3, {
    params: Promise.resolve({ params: ['width=640', '..', '..', 'etc', 'passwd'] }),
  });
  assert.equal(res3.status, 400, 'Must reject path traversal with 400 Bad Request');

  // Subtest 4: Non-existent image returns 404 cleanly without 500
  const req4 = new NextRequest('http://localhost:3000/cdn-cgi/image/width=640/non-existent-image-xyz.jpg');
  const res4 = await route.GET(req4, {
    params: Promise.resolve({ params: ['width=640', 'non-existent-image-xyz.jpg'] }),
  });
  assert.equal(res4.status, 404, 'Must return 404 for missing image');
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Robots.txt and 404 Metadata Verification
// ─────────────────────────────────────────────────────────────────────────────
test('Robots.txt permits cdn-cgi image crawlers across Googlebot, Bingbot, and Googlebot-Image', async () => {
  const robotsPath = path.join(rootDir, 'public/robots.txt');
  const robotsContent = fs.readFileSync(robotsPath, 'utf8');

  // Check cdn-cgi/image is allowed under User-agent: *, Googlebot, Bingbot, and Googlebot-Image
  assert.ok(
    robotsContent.includes('Allow: /cdn-cgi/image/'),
    'Robots.txt must explicitly allow /cdn-cgi/image/'
  );

  // Validate Googlebot section
  const googlebotSection = robotsContent.substring(
    robotsContent.indexOf('User-agent: Googlebot'),
    robotsContent.indexOf('User-agent: Bingbot')
  );
  assert.ok(
    googlebotSection.includes('Allow: /cdn-cgi/image/'),
    'Googlebot section must explicitly allow /cdn-cgi/image/'
  );

  // Validate Bingbot section
  const bingbotSection = robotsContent.substring(
    robotsContent.indexOf('User-agent: Bingbot'),
    robotsContent.indexOf('# Generative AI')
  );
  assert.ok(
    bingbotSection.includes('Allow: /cdn-cgi/image/'),
    'Bingbot section must explicitly allow /cdn-cgi/image/'
  );

  // Check not-found page defines noindex
  const notFoundPath = path.join(rootDir, 'app/not-found.tsx');
  const notFoundContent = fs.readFileSync(notFoundPath, 'utf8');
  assert.ok(
    notFoundContent.includes("index: false"),
    '404 page metadata must specify index: false'
  );
  assert.ok(
    notFoundContent.includes("title: 'Page Not Found'"),
    '404 page metadata must specify title'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. XML Sitemap Recalibration Verification
// ─────────────────────────────────────────────────────────────────────────────
test('Sitemap generates complete category, style, brand and product routes without spaces', async () => {
  const { default: sitemap } = await import(path.join(rootDir, 'app/sitemap.ts'));
  const urls = await sitemap();

  assert.ok(Array.isArray(urls), 'Sitemap must return an array');
  assert.ok(urls.length > 50, `Sitemap must contain products (found: ${urls.length})`);

  const urlStrings = urls.map((u) => u.url);

  // Check Core Categories
  assert.ok(urlStrings.some((u) => u.includes('/shop?category=MEN')), 'Must include MEN category');
  assert.ok(urlStrings.some((u) => u.includes('/shop?category=WOMEN')), 'Must include WOMEN category');
  assert.ok(urlStrings.some((u) => u.includes('/shop?category=KIDS')), 'Must include KIDS category');
  assert.ok(urlStrings.some((u) => u.includes('/shop?category=ACCESSORIES')), 'Must include ACCESSORIES category');

  // Check Styles
  assert.ok(urlStrings.some((u) => u.includes('/shop?style=OXFORD')), 'Must include OXFORD style');
  assert.ok(urlStrings.some((u) => u.includes('/shop?style=PESHAWARI')), 'Must include PESHAWARI style');
  assert.ok(urlStrings.some((u) => u.includes('/shop?style=MOCCASINS')), 'Must include MOCCASINS style');

  // Check Brands
  assert.ok(urlStrings.some((u) => u.includes('/shop?brand=Executive%20Mochi')), 'Must include brand landing');

  // Verify URL integrity: NO spaces in any sitemap URL!
  for (const entry of urls) {
    assert.ok(
      !entry.url.includes(' '),
      `Sitemap URL must not contain unescaped spaces: "${entry.url}"`
    );
    assert.ok(
      entry.url.startsWith('https://') || entry.url.startsWith('http://'),
      `Sitemap URL must be absolute: "${entry.url}"`
    );
    assert.ok(entry.priority !== undefined, `Sitemap entry must have priority: ${entry.url}`);
    assert.ok(entry.changeFrequency !== undefined, `Sitemap entry must have changeFrequency: ${entry.url}`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Product Router Multi-Identifier Lookup, SKU Search, and Slug Sanitization
// ─────────────────────────────────────────────────────────────────────────────
test('Product router enforces multi-identifier resolution, SKU search, zero image gating, and slug sanitization', async () => {
  const routerPath = path.join(rootDir, 'server/routers/product.ts');
  const source = fs.readFileSync(routerPath, 'utf8');

  // Verify getBySlug supports exact slug, case-insensitive, normalized, articleNumber, and variant SKU
  assert.ok(
    source.includes('articleNumber: { equals: trimmed, mode: "insensitive" as const }'),
    'getBySlug must resolve products by articleNumber'
  );
  assert.ok(
    source.includes('variants: { some: { sku: { equals: trimmed, mode: "insensitive" as const } } }'),
    'getBySlug must resolve products by variant SKU'
  );
  assert.ok(
    source.includes('slug: { equals: trimmed, mode: "insensitive" as const }'),
    'getBySlug must resolve products case-insensitively'
  );

  // Verify getBySlug does NOT restrict products to images: { some: {} }
  const getBySlugSection = source.substring(source.indexOf('getBySlug:'));
  const getBySlugBody = getBySlugSection.substring(0, getBySlugSection.indexOf('getById:'));
  assert.ok(
    !getBySlugBody.includes('images: { some: {} }'),
    'getBySlug must NOT gate products on having images, preventing 404s for products awaiting photos'
  );

  // Verify getAll includes SKU search across variants
  assert.ok(
    source.includes('variants: { some: { sku: { contains: input.search, mode: "insensitive" } } }'),
    'getAll must support searching products by variant SKU'
  );

  // Verify getAll does NOT gate browsed products on having images by default
  const getAllSection = source.substring(source.indexOf('getAll: publicProcedure'));
  const getAllBody = getAllSection.substring(0, getAllSection.indexOf('getBySlug:'));
  assert.ok(
    !getAllBody.includes('...(input?.search ? {} : { images: { some: {} } })'),
    'getAll must not unconditionally hide products without images during category browsing'
  );
  assert.ok(
    getAllBody.includes('...(input?.hasImages ? { images: { some: {} } } : {})'),
    'getAll must allow opt-in image filtering via hasImages'
  );

  // Verify ProductCreateSchema sanitizes slug
  assert.ok(
    source.includes("slug: z.string().min(1).transform"),
    'ProductCreateSchema must sanitize slug strings'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Product Page SEO, Structured Data, SKU UI, and Suspense Boundary
// ─────────────────────────────────────────────────────────────────────────────
test('PDP embeds all variant SKUs into structured data and wraps ProductDetails in Suspense', async () => {
  const pagePath = path.join(rootDir, 'app/(storefront)/product/[slug]/page.tsx');
  const pageSource = fs.readFileSync(pagePath, 'utf8');

  // Verify primary SKU is not mangled by regex stripping
  assert.ok(
    !pageSource.includes(".replace(/^\\d+-/, '')"),
    'PDP must NOT strip digits from SKU/article numbers with regex'
  );
  assert.ok(
    pageSource.includes('sku: primarySku'),
    'PDP JSON-LD must assign primarySku to schema.org/Product'
  );
  assert.ok(
    pageSource.includes('mpn: primaryMpn'),
    'PDP JSON-LD must assign primaryMpn to schema.org/Product'
  );

  // Verify hasVariant and multi-variant offers
  assert.ok(
    pageSource.includes('hasVariant: (product.variants || []).map'),
    'PDP JSON-LD must provide hasVariant array for all variant SKUs'
  );
  assert.ok(
    pageSource.includes('structuredOffers'),
    'PDP JSON-LD must provide structured offers for variant SKUs'
  );

  // Verify tier 4 canonical redirects for SKUs and article numbers
  assert.ok(
    pageSource.includes('permanentRedirect(`/product/${product.slug}?variant=${encodeURIComponent(matchedVariant.sku)}`)'),
    'PDP must redirect non-canonical variant SKU URLs to canonical URL with ?variant=SKU'
  );

  // Verify Suspense boundary around ProductDetails to prevent de-opt
  assert.ok(
    pageSource.includes('<Suspense'),
    'PDP must wrap ProductDetails in a Suspense boundary'
  );

  // Verify ProductDetails parses variant URL param and renders SKU badge
  const detailsPath = path.join(rootDir, 'app/(storefront)/product/[slug]/product-details.tsx');
  const detailsSource = fs.readFileSync(detailsPath, 'utf8');

  assert.ok(
    detailsSource.includes("searchParams?.get('variant')"),
    'ProductDetails must read ?variant=SKU search parameter'
  );
  assert.ok(
    detailsSource.includes('SKU: {selectedVariant?.sku'),
    'ProductDetails must display active variant SKU badge'
  );
  assert.ok(
    !detailsSource.includes('\nimport { useSearchParams } from \'next/navigation\';\n\nexport function ProductDetails'),
    'ProductDetails must not import useSearchParams mid-file'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Next.js Configuration and Redirects Verification
// ─────────────────────────────────────────────────────────────────────────────
test('NextConfig configures custom Cloudflare loader and SEO redirects', async () => {
  const nextConfigPath = path.join(rootDir, 'next.config.mjs');
  const configSource = fs.readFileSync(nextConfigPath, 'utf8');

  // Verify custom Cloudflare loader is registered
  assert.ok(
    configSource.includes("loader: 'custom'"),
    'NextConfig must specify loader: custom'
  );
  assert.ok(
    configSource.includes("loaderFile: './lib/cloudflare-image-loader.ts'"),
    'NextConfig must specify loaderFile pointing to Cloudflare loader'
  );

  // Verify SEO redirects exist for SKU, catalog, and articles
  assert.ok(configSource.includes("source: '/catalog'"), 'Must redirect /catalog to /shop');
  assert.ok(configSource.includes("source: '/sku/:sku+'"), 'Must redirect /sku/ to /product/');
  assert.ok(configSource.includes("source: '/article/:article+'"), 'Must redirect /article/ to /product/');

  // Verify immutable CDN cache headers for Cloudflare image path
  assert.ok(
    configSource.includes("source: '/cdn-cgi/image/:path*'"),
    'Must configure cache headers for /cdn-cgi/image/'
  );
  assert.ok(
    configSource.includes("Cloudflare-CDN-Cache-Control"),
    'Must set Cloudflare-CDN-Cache-Control header'
  );
});
