const PRODUCTION_URL = "https://www.thevitaminspotltd.com";

/** Resolve the public site URL at runtime (important on Vercel server). */
export function resolveSiteUrl() {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envUrl && !/localhost|127\.0\.0\.1/.test(envUrl)) {
    return envUrl.replace(/\/$/, "");
  }
  if (process.env.VERCEL_ENV === "production") {
    return PRODUCTION_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, "");
  }
  return envUrl?.replace(/\/$/, "") ?? "http://localhost:3000";
}

export const site = {
  name: "The Vitamin Spot",
  legalName: "The Vitamin Spot",
  tagline: "Supplements and vitamins in Abuja. IV if you want one.",
  description:
    "The Vitamin Spot in Abuja sells vitamin packs and supplements, and books IV drip sessions. Walk in at Theodak Plaza, CBD, or shop and book online.",
  get url() {
    return resolveSiteUrl();
  },
  locale: "en-NG",
  currency: "NGN",
  phone: "+234 814 224 6407",
  phoneHref: "+2348142246407",
  whatsapp: "2348142246407",
  whatsappUs: "13129980147",
  email: "thevitaminspotltd@gmail.com",
  instagram: "https://instagram.com/the_vitaminspot",
  instagramHandle: "@the_vitaminspot",
  address: {
    line1: "Theodak Plaza, Plot 1008 National Hospital Road",
    line2: "Ali Muhammad Zarah St",
    area: "Central Business District",
    city: "Abuja",
    postalCode: "900103",
    region: "Federal Capital Territory",
    country: "Nigeria",
    label: "Central Business District, Abuja",
    full: "Theodak Plaza, Plot 1008 National Hospital Road, Ali Muhammad Zarah St, Central Business District, Abuja 900103, Federal Capital Territory",
    mapUrl:
      "https://maps.google.com/?q=Theodak+Plaza,+Plot+1008+National+Hospital+Road,+Ali+Muhammad+Zarah+St,+Central+Business+District,+Abuja+900103",
    embedUrl:
      "https://maps.google.com/maps?q=Theodak+Plaza,+Plot+1008+National+Hospital+Road,+Ali+Muhammad+Zarah+St,+Central+Business+District,+Abuja+900103&z=16&ie=UTF8&iwloc=&output=embed",
  },
  hours: [
    { label: "Shop & IV", value: "Walk-in welcome" },
    { label: "Visits", value: "Message ahead on WhatsApp" },
  ],
  developer: {
    name: "Adesanoye",
    url: (process.env.NEXT_PUBLIC_DEVELOPER_URL ?? "https://studio.adesanoye.online").replace(
      /\/$/,
      "",
    ),
  },
};

export function whatsappHref(text?: string, number: string = site.whatsapp) {
  const message = text ?? `Hi ${site.name}.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
