import type { Metadata } from "next";
import localFont from "next/font/local";
import { StripCursorRefs } from "@/components/dev/strip-cursor-refs";
import { Providers } from "@/components/providers";
import { brand } from "@/lib/brand";
import { infusions } from "@/lib/catalog";
import { PRODUCTION_URL, resolveSiteUrl, site } from "@/lib/site";
import "./globals.css";

/** Stable for OG/metadata; JSON-LD below can still use the request host. */
const metadataOrigin = PRODUCTION_URL;
const siteUrl = resolveSiteUrl();


/** Self-hosted latin files — avoids next/font/google kit-URL build flake. */
const display = localFont({
  src: [
    { path: "./fonts/fraunces-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/fraunces-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
});

const wordmark = localFont({
  src: [
    { path: "./fonts/cormorant-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/cormorant-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-wordmark",
  display: "swap",
});

const sans = localFont({
  src: [
    { path: "./fonts/jakarta-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/jakarta-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/jakarta-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(metadataOrigin),
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
  applicationName: site.name,
  openGraph: {
    title: site.name,
    description: site.description,
    images: [{ url: brand.logo.src, alt: brand.logo.alt }],
    locale: "en_NG",
    type: "website",
    siteName: site.name,
  },
  alternates: { canonical: "/" },
};

const organizationId = `${siteUrl}/#organization`;
const websiteId = `${siteUrl}/#website`;
const businessId = `${siteUrl}/#business`;
const logoUrl = `${siteUrl}${brand.mark.src}`;

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": organizationId,
      name: site.name,
      legalName: site.legalName,
      url: site.url,
      logo: {
        "@type": "ImageObject",
        "@id": `${site.url}/#logo`,
        url: logoUrl,
        contentUrl: logoUrl,
        width: brand.mark.width,
        height: brand.mark.height,
        caption: site.name,
      },
      image: logoUrl,
      sameAs: [site.instagram],
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      url: site.url,
      name: site.name,
      alternateName: ["The Vitamin Spot", site.legalName],
      inLanguage: site.locale,
      publisher: { "@id": organizationId },
    },
    {
      "@type": "HealthAndBeautyBusiness",
      "@id": businessId,
      name: site.name,
      description: site.description,
      telephone: site.phone,
      email: site.email,
      url: site.url,
      image: `${site.url}${brand.logo.src}`,
      logo: { "@id": `${site.url}/#logo` },
      parentOrganization: { "@id": organizationId },
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
      provider: { "@id": businessId },
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
        className={`${display.variable} ${wordmark.variable} ${sans.variable} bg-cream font-sans text-ink antialiased`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k="data-cursor-ref",n=document;if(!n.documentElement)return;n.querySelectorAll("["+k+"]").forEach(function(el){el.removeAttribute(k);});}catch(e){}})();`,
          }}
        />
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
