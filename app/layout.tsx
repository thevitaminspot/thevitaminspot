import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { StripCursorRefs } from "@/components/dev/strip-cursor-refs";
import { Providers } from "@/components/providers";
import { brand } from "@/lib/brand";
import { infusions } from "@/lib/catalog";
import { site } from "@/lib/site";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-display",
  display: "swap",
});

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} · Abuja`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    title: site.name,
    description: site.description,
    images: [{ url: brand.logo.src }],
    locale: "en_NG",
    type: "website",
    siteName: site.name,
  },
  alternates: { canonical: "/" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "HealthAndBeautyBusiness",
      "@id": `${site.url}/#business`,
      name: site.name,
      description: site.description,
      telephone: site.phone,
      email: site.email,
      url: site.url,
      image: `${site.url}${brand.logo.src}`,
      sameAs: [site.instagram],
      hasMap: site.address.mapUrl,
      areaServed: site.address.city,
      address: {
        "@type": "PostalAddress",
        streetAddress: `${site.address.line1}, ${site.address.line2}`,
        addressLocality: site.address.area,
        addressRegion: site.address.region,
        postalCode: site.address.postalCode,
        addressCountry: "NG",
      },
    },
    ...infusions.map((drip) => ({
      "@type": "Service",
      name: `${drip.name} IV drip`,
      description: drip.description,
      provider: { "@id": `${site.url}/#business` },
      areaServed: site.address.city,
      url: `${site.url}/infusions?drip=${drip.slug}`,
    })),
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://imagedelivery.net" />
        <link rel="dns-prefetch" href="https://img.clerk.com" />
      </head>
      <body
        suppressHydrationWarning
        className={`${display.variable} ${sans.variable} bg-cream font-sans text-ink antialiased`}
      >
        {process.env.NODE_ENV === "development" ? <StripCursorRefs /> : null}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
