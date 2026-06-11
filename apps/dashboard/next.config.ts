import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "**.cloudflare.com",
      },
    ],
  },
  // Allow backend API during development
  async rewrites() {
    return process.env.NODE_ENV === "development"
      ? [
          {
            source: "/api/proxy/:path*",
            destination: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"}/:path*`,
          },
        ]
      : [];
  },
};

export default nextConfig;
