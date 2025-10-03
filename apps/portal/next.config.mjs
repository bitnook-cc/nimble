/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const isDevelopment = process.env.NODE_ENV === 'development';

    const vaultUrl = isDevelopment
      ? 'http://localhost:4321'
      : 'https://nimble-vault.vercel.app/vault';

    return [
      {
        source: "/vault",
        destination: `${vaultUrl}/`,
      },
      {
        source: "/vault/",
        destination: `${vaultUrl}/`,
      },
      {
        source: "/vault/_next/:path*",
        destination: `${vaultUrl}/_next/:path*`,
      },
      {
        source: "/vault/:path*",
        destination: `${vaultUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;