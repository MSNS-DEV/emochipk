/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
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

}


export default nextConfig
