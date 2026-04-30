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

}

export default nextConfig
