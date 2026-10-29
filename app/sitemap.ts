import type { MetadataRoute } from "next";
import { listInfusions, listProducts } from "@/lib/data";
import { site } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, infusions] = await Promise.all([listProducts(), listInfusions()]);

  const staticRoutes = [
    "",
    "/shop",
    "/infusions",
    "/about",
    "/contact",
    "/terms",
    "/shipping",
    "/refunds",
    "/privacy",
  ].map((path) => {
    const isPolicy = ["/terms", "/shipping", "/refunds", "/privacy"].includes(path);
    return {
      url: `${site.url}${path}`,
      lastModified: new Date(),
      changeFrequency: path === "" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "" ? 1 : isPolicy ? 0.4 : 0.8,
    };
  });

  return [
    ...staticRoutes,
    ...products.map((product) => ({
      url: `${site.url}/shop/${product.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...infusions.map((drip) => ({
      url: `${site.url}/infusions?drip=${drip.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
  ];
}
