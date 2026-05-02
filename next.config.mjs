/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 't3.storageapi.dev',
      },
      {
        protocol: 'https',
        hostname: 'executivemochi.pk',
      },
    ],
  },

}


export default nextConfig
