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
  async rewrites() {
    // Only rewrite if basePath is configured
    if (!process.env.NEXT_PUBLIC_BASE_PATH) {
      return [];
    }

    return [
      {
        source: "/:path((?!vault).*)*",
        destination: `${process.env.NEXT_PUBLIC_BASE_PATH}/:path*`,
        basePath: false,
      },
    ];
  },
}

export default nextConfig
