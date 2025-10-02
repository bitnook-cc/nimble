/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/vault/:path*",
        destination: "https://nimble-vault.vercel.app/:path*",
      },
      {
        source: "/characters/:path*",
        destination: "https://nimble-characters.vercel.app/:path*",
      },
      {
        source: "/dice/:path*",
        destination: "https://nimble-dice.vercel.app/:path*",
      },
    ];
  },
};

export default nextConfig;