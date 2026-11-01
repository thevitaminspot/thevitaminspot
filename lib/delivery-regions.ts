import {
  INTERNATIONAL_SLUG,
  OUTSIDE_ABUJA_SLUG,
} from "@/lib/delivery-region-slugs";

export { INTERNATIONAL_SLUG, OUTSIDE_ABUJA_SLUG };

export type DeliveryRegion = "abuja" | "nigeria" | "international";

export function deliveryRegionForSlug(slug: string): DeliveryRegion {
  if (slug === OUTSIDE_ABUJA_SLUG) return "nigeria";
  if (slug === INTERNATIONAL_SLUG) return "international";
  return "abuja";
}

export function isAbujaAreaZone(slug: string) {
  return deliveryRegionForSlug(slug) === "abuja";
}

export function zoneSlugForRegion(region: DeliveryRegion, abujaSlug: string) {
  if (region === "nigeria") return OUTSIDE_ABUJA_SLUG;
  if (region === "international") return INTERNATIONAL_SLUG;
  return abujaSlug;
}

export function partitionZones<T extends { slug: string; name: string }>(zones: T[]) {
  const abuja: T[] = [];
  const nigeria: T[] = [];
  const international: T[] = [];

  for (const zone of zones) {
    const region = deliveryRegionForSlug(zone.slug);
    if (region === "nigeria") nigeria.push(zone);
    else if (region === "international") international.push(zone);
    else abuja.push(zone);
  }

  abuja.sort((a, b) => a.name.localeCompare(b.name));
  return { abuja, nigeria, international };
}
