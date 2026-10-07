import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  async redirects() {
    return [{ source: "/book", destination: "/infusions", permanent: false }];
  },
  serverExternalPackages: ["pg", "@prisma/client", "@prisma/adapter-pg"],
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2_678_400,
    remotePatterns: [
      { protocol: "https", hostname: "imagedelivery.net" },
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
};

export default nextConfig;
