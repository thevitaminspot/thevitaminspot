import { infusions, products } from "@/lib/catalog";
import { site, whatsappHref } from "@/lib/site";

export function GET() {
  const lines = [
    `# ${site.name}`,
    "",
    `> ${site.tagline}`,
    "",
    "## About",
    site.description,
    "",
    "## Location",
    site.address.full,
    site.address.mapUrl,
    "",
    "## Contact",
    `- Phone: ${site.phone}`,
    `- Email: ${site.email}`,
    `- WhatsApp: ${whatsappHref()}`,
    `- Instagram: ${site.instagram}`,
    "",
    "## Shop — vitamin packs and supplements",
    ...products.map(
      (product) =>
        `- ${product.name}: ${product.tagline} — ${site.url}/shop/${product.slug}`,
    ),
    "",
    "## IV drips — book online or walk in",
    ...infusions.map(
      (drip) =>
        `- ${drip.name}: ${drip.tagline} (${drip.durationMin} min) — ${site.url}/infusions?drip=${drip.slug}`,
    ),
    "",
    "## Key pages",
    `- Home: ${site.url}/`,
    `- Shop: ${site.url}/shop`,
    `- Book an IV: ${site.url}/infusions`,
    `- Contact: ${site.url}/contact`,
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
