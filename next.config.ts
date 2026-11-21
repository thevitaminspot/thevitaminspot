import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://*.clerk.accounts.dev https://*.clerk.com https://clerk.thevitaminspotltd.com https://js.paystack.co https://challenges.cloudflare.com https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://img.clerk.com https://*.clerk.com https://imagedelivery.net",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""} https://*.clerk.accounts.dev https://*.clerk.com https://clerk.thevitaminspotltd.com https://api.paystack.co https://standard.paystack.co https://checkout.paystack.com https://res.cloudinary.com https://vitals.vercel-insights.com https://va.vercel-scripts.com`,
  "frame-src 'self' https://checkout.paystack.com https://standard.paystack.co https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com https://www.google.com https://maps.google.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.paystack.com https://standard.paystack.co",
  "frame-ancestors 'self'",
].join("; ");

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
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: cspDirectives,
          },
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
      // Multipart uploads; keep under Vercel’s ~4.5MB request cap with headroom for form overhead.
      // Client compresses large phone photos before upload (see lib/prepare-image-upload.ts).
      bodySizeLimit: "4.5mb",
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
