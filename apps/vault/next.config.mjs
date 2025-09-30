/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standard Next.js configuration (removed static export to support API routes)
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
