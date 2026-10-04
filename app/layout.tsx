import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { CartDrawer } from "@/components/shop/cart-drawer";
import { Providers } from "@/components/providers";
import { brand } from "@/lib/brand";
import { listProducts } from "@/lib/data";
import { site } from "@/lib/site";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-display",
});

const sans = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} · Abuja`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  openGraph: {
    title: site.name,
    description: site.description,
    images: [{ url: brand.logo.src }],
    locale: "en_NG",
    type: "website",
  },
  icons: { icon: brand.logo.src },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "HealthAndBeautyBusiness",
  name: site.name,
  description: site.description,
  telephone: site.phone,
  email: site.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: site.address.line1,
    addressLocality: site.address.area,
    addressRegion: "FCT",
    addressCountry: "NG",
  },
  url: site.url,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const packs = (await listProducts())
    .filter((product) => product.featured)
    .map((product) => ({ href: `/shop/${product.slug}`, label: product.name }));

  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable} bg-cream font-sans text-ink antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers>
          <Header />
          {children}
          <Footer packs={packs} />
          <CartDrawer />
        </Providers>
      </body>
    </html>
  );
}
