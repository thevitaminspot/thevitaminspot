import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

const privatePaths = ["/admin", "/account", "/orders/", "/appointments/", "/api/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: privatePaths },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
