/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vqz56f5g7q.ufs.sh.global.cloud',
      },
    ],
  },

  async redirects() {
    return [
      {
        source: '/:path*',
        destination: 'https://www.executivemochi.pk/:path*',
        permanent: true,
        has: [{ type: 'host', value: 'executivemochi.pk' }],
      },
    ]
  },
}

export default nextConfig
