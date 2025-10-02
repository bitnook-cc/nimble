/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',

  // Disable linting during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Enable TypeScript checking again
  typescript: {
    ignoreBuildErrors: false,
  },

  turbopack: {
    rules: {
      '*.{md,mdx}': {
        loaders: ['@next/mdx-loader'],
      },
    },
  },
}

export default nextConfig
