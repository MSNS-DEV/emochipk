/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,
  images: {
    loader: 'custom',
    loaderFile: './lib/cloudflare-image-loader.ts',
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: '**.r2.dev',
      },
      {
        protocol: 'https',
        hostname: 'images.executivemochi.pk',
      },
      {
        protocol: 'https',
        hostname: 'cdn.executivemochi.pk',
      },
      {
        protocol: 'https',
        hostname: 'executivemochi.pk',
      },
    ],
  },
  async redirects() {
    return [
      // 1. Catalog roots
      {
        source: '/catalog',
        destination: '/shop',
        permanent: true,
      },
      {
        source: '/products',
        destination: '/shop',
        permanent: true,
      },
      {
        source: '/items',
        destination: '/shop',
        permanent: true,
      },
      {
        source: '/item',
        destination: '/shop',
        permanent: true,
      },
      {
        source: '/collections',
        destination: '/shop',
        permanent: true,
      },
      {
        source: '/collection',
        destination: '/shop',
        permanent: true,
      },
      {
        source: '/product',
        destination: '/shop',
        permanent: true,
      },
      // 2. Dynamic single product redirects (use :slug+ to ensure at least 1 segment matches)
      {
        source: '/products/:slug+',
        destination: '/product/:slug+',
        permanent: true,
      },
      {
        source: '/items/:slug+',
        destination: '/product/:slug+',
        permanent: true,
      },
      {
        source: '/item/:slug+',
        destination: '/product/:slug+',
        permanent: true,
      },
      {
        source: '/sku/:sku+',
        destination: '/product/:sku+',
        permanent: true,
      },
      {
        source: '/article/:article+',
        destination: '/product/:article+',
        permanent: true,
      },
      // 3. Category & collection paths
      {
        source: '/collections/:path+',
        destination: '/shop',
        permanent: true,
      },
      {
        source: '/collection/:path+',
        destination: '/shop',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/cdn-cgi/image/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, s-maxage=31536000, immutable' },
          { key: 'Cloudflare-CDN-Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'CDN-Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/api/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, s-maxage=31536000, immutable' },
          { key: 'Cloudflare-CDN-Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'CDN-Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },
};

export default nextConfig;
