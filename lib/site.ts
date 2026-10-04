export const site = {
  name: "The Vitamin Spot",
  legalName: "The Vitamin Spot",
  tagline: "Supplements and vitamins in Abuja. IV if you want one.",
  description: "The Vitamin Spot in Abuja. Supplements, vitamins, and IV bookings.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  locale: "en-NG",
  currency: "NGN",
  phone: "+234 814 224 6407",
  phoneHref: "+2348142246407",
  whatsapp: "2348142246407",
  whatsappUs: "13129980147",
  email: "thevitaminspotltd@gmail.com",
  instagram: "https://instagram.com/yasbeautyallure",
  instagramHandle: "@yasbeautyallure",
  address: {
    line1: "Abuja",
    area: "FCT",
    city: "Abuja",
    country: "Nigeria",
    mapUrl: "https://maps.google.com/?q=Abuja+Nigeria",
    embedUrl:
      "https://maps.google.com/maps?q=Abuja%20Nigeria&t=&z=12&ie=UTF8&iwloc=&output=embed",
  },
  hours: [
    { label: "Shop & IV", value: "Walk-in welcome" },
    { label: "Visits", value: "Message ahead on WhatsApp" },
  ],
} as const;

export function whatsappHref(text?: string, number: string = site.whatsapp) {
  const message = text ?? `Hi ${site.name}.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
