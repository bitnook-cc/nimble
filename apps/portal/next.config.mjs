/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const isDevelopment = process.env.NODE_ENV === 'development';

    const vaultUrl = isDevelopment
      ? 'http://localhost:4321'
      : 'https://nimble-vault.vercel.app';

    return [
      {
        source: "/vault/",
        destination: `${vaultUrl}/`,
      },
      {
        source: "/vault/:path*/",
        destination: `${vaultUrl}/:path*/`,
      },
      {
        source: "/vault/:path*",
        destination: `${vaultUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;