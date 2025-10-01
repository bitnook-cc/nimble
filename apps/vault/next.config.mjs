/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standard Next.js configuration (removed static export to support API routes)
  // Set base path from environment variable (e.g., NEXT_PUBLIC_BASE_PATH=/vault)
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
