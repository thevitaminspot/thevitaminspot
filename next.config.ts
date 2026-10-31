import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  poweredByHeader: false,
  compress: true,
  async redirects() {
    return [
      { source: "/book", destination: "/infusions", permanent: false },
      // Old deep links / emails used /admin/orders/:id
      {
        source: "/admin/orders/:id((?!detail$).*)",
        destination: "/admin/orders/detail?id=:id",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  serverExternalPackages: ["pg", "@prisma/client", "@prisma/adapter-pg"],
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2_678_400,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: "https", hostname: "imagedelivery.net" },
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  experimental: {
    serverActions: {
      // Product image uploads use multipart FormData; default 1MB rejects before our handlers run.
      bodySizeLimit: "10mb",
    },
    optimizePackageImports: ["lucide-react", "@clerk/nextjs"],
    staleTimes: {
      // Auth pages must not reuse a signed-out RSC payload after login.
      dynamic: 0,
      // Catalog/marketing segments can stay warm in the client router cache.
      static: 300,
    },
  },
};

export default nextConfig;
