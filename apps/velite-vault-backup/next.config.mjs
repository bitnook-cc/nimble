import { build } from 'velite'

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
  
  // Velite webhook for development
  webpack: (config, { dev, isServer }) => {
    config.plugins.push(new VeliteWebpackPlugin())
    return config
  },
}

class VeliteWebpackPlugin {
  static started = false
  constructor(options = {}) {
    this.options = options
  }
  apply(compiler) {
    // executed three times in nextjs :(
    // twice for the server (nodejs / edge runtime) and once for the client
    compiler.hooks.beforeCompile.tapPromise('VeliteWebpackPlugin', async () => {
      if (VeliteWebpackPlugin.started) return
      VeliteWebpackPlugin.started = true
      const dev = compiler.options.mode === 'development'
      await build({ watch: dev, clean: !dev })
    })
  }
}

export default nextConfig
