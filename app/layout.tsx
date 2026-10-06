import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ScrollToTop } from "@/components/layout/scroll-to-top";
import { CartDrawer } from "@/components/shop/cart-drawer";
import { Providers } from "@/components/providers";
import { brand } from "@/lib/brand";
import { infusions } from "@/lib/catalog";
import { listProducts } from "@/lib/data";
import { site } from "@/lib/site";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal"],
  variable: "--font-display",
});

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
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

const stripCursorRefs = `(function(){
  var attr = "data-cursor-ref";
  function strip(node){
    if(!node || node.nodeType !== 1) return;
    if(node.hasAttribute(attr)) node.removeAttribute(attr);
    var found = node.querySelectorAll("[" + attr + "]");
    for(var i = 0; i < found.length; i++) found[i].removeAttribute(attr);
  }
  strip(document.documentElement);
  var observer = new MutationObserver(function(records){
    for(var i = 0; i < records.length; i++){
      var record = records[i];
      if(record.type === "attributes") record.target.removeAttribute(attr);
      else for(var j = 0; j < record.addedNodes.length; j++) strip(record.addedNodes[j]);
    }
  });
  observer.observe(document.documentElement, {subtree:true, childList:true, attributes:true, attributeFilter:[attr]});
  window.__stopStrippingCursorRefs = function(){ observer.disconnect(); };
})();`;

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

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const packs = (await listProducts())
    .filter((product) => product.featured)
    .map((product) => ({ href: `/shop/${product.slug}`, label: product.name }));

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${display.variable} ${sans.variable} bg-cream font-sans text-ink antialiased`}
      >
        {process.env.NODE_ENV === "development" ? (
          <script dangerouslySetInnerHTML={{ __html: stripCursorRefs }} />
        ) : null}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers>
          <ScrollToTop />
          <Header />
          {children}
          <Footer packs={packs} />
          <CartDrawer />
        </Providers>
      </body>
    </html>
  );
}
