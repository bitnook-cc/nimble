/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Note: Rewrites don't work with static export
  // For local dev, we'll need to call the API directly at localhost:3001
  // In production, Vercel will handle the rewrites
};

export default nextConfig;