import type { MetadataRoute } from "next";
import { products, infusions } from "@/lib/catalog";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/shop", "/infusions", "/book", "/about", "/contact"].map(
    (path) => ({
      url: `${site.url}${path}`,
      lastModified: new Date(),
    }),
  );

  return [
    ...staticRoutes,
    ...products.map((product) => ({
      url: `${site.url}/shop/${product.slug}`,
      lastModified: new Date(),
    })),
    ...infusions.map((drip) => ({
      url: `${site.url}/infusions#${drip.slug}`,
      lastModified: new Date(),
    })),
  ];
}
