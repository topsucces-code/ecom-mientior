/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@ecommerce/shared', '@ecommerce/ui'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
}

module.exports = nextConfig