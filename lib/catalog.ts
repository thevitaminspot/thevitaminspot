import { majorAbujaAreas } from "@/lib/abuja-areas";
import { nairaToKobo } from "@/lib/money";

/** Max product photos in admin and on the storefront gallery. */
export const PRODUCT_MAX_IMAGES = 4;

export type CatalogCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
};

export type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  benefits: string[];
  ingredients: string[];
  usage: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  stock: number;
  featured: boolean;
  isActive?: boolean;
  categorySlug: string;
  images: { url: string; alt: string }[];
};

export type CatalogInfusion = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  benefits: string[];
  ingredients: string[];
  durationMin: number;
  price: number;
  deposit: number;
  featured: boolean;
  isActive?: boolean;
  appointmentCount?: number;
  image: string;
};

export type CatalogZone = {
  id: string;
  name: string;
  slug: string;
  fee: number;
  eta: string;
};

export const categories: CatalogCategory[] = [
  {
    id: "cat-rituals",
    name: "Everyday",
    slug: "daily-rituals",
    description: "Things you take through the week.",
  },
  {
    id: "cat-glow",
    name: "Skin",
    slug: "glow-support",
    description: "Collagen.",
  },
  {
    id: "cat-essentials",
    name: "Basics",
    slug: "daily-essentials",
    description: "Iron and the everyday tablets.",
  },
];

export const products: CatalogProduct[] = [
  {
    id: "prod-cranberry",
    name: "Cranberry Probiotic",
    slug: "cranberry-probiotic",
    tagline: "Cranberry and probiotics, for five mornings.",
    description:
      "A box of five cranberry probiotic ampoules. Chill one, snap the top, and drink it in the morning.",
    benefits: [
      "Supports a balanced gut",
      "Helps maintain daily freshness",
      "Simple five-day routine",
    ],
    ingredients: [
      "Cranberry extract",
      "Plant-based probiotic cultures",
      "Purified water",
    ],
    usage:
      "Chill, snap, and drink one ampoule in the morning. Complete the box over five days, or as advised by your practitioner.",
    price: nairaToKobo(65000),
    sku: "TVS-HERB-CRAN-5",
    stock: 24,
    featured: true,
    categorySlug: "daily-rituals",
    images: [
      {
        url: "/images/products/cranberry/box.jpg",
        alt: "Cranberry probiotic box with ampoule tray",
      },
      {
        url: "/images/products/cranberry/ampoules.jpg",
        alt: "Close view of cranberry probiotic ampoules in a black tray",
      },
      {
        url: "/images/products/cranberry/held.jpg",
        alt: "Open cranberry probiotic box",
      },
    ],
  },
  {
    id: "prod-tomato",
    name: "Tomato Yeast",
    slug: "tomato-yeast",
    tagline: "Tomato yeast for skin. Five days.",
    description:
      "Five ampoules of tomato extract and yeast. Take one with breakfast and keep the tray out of the sun.",
    benefits: [
      "Supports a more even-looking complexion",
      "Antioxidant tomato botanicals",
      "Five-day daily ritual",
    ],
    ingredients: ["Tomato extract", "Nutritional yeast", "Purified water"],
    usage: "Take one ampoule daily, preferably with breakfast. Keep the tray cool and away from direct sun.",
    price: nairaToKobo(40000),
    sku: "TVS-HERB-TOMA-5",
    stock: 18,
    featured: true,
    categorySlug: "daily-rituals",
    images: [
      {
        url: "/images/products/tomato/box.jpg",
        alt: "Tomato yeast drink box",
      },
      {
        url: "/images/products/tomato/tray.jpg",
        alt: "Five tomato extract ampoules on a white tray",
      },
      {
        url: "/images/products/tomato/held.jpg",
        alt: "Hand holding a tray of tomato yeast ampoules",
      },
    ],
  },
  {
    id: "prod-chiselan",
    name: "Collagen Atelier",
    slug: "collagen-atelier",
    tagline: "Collagen vials for the month.",
    description:
      "Small-molecule collagen with vitamin C and hyaluronic acid — a full case for a month of mornings.",
    benefits: [
      "Small-molecule collagen for daily use",
      "Simple routine for home or travel",
      "Support for skin elasticity",
    ],
    ingredients: ["Hydrolysed collagen", "Vitamin C", "Hyaluronic acid"],
    usage: "Dissolve one vial in cool water each morning. Complete the case as a monthly routine, not a sprint.",
    price: nairaToKobo(165000),
    sku: "TVS-CHIS-COL-SET",
    stock: 8,
    featured: true,
    categorySlug: "glow-support",
    images: [
      {
        url: "/images/products/chiselan/lid.jpg",
        alt: "Open collagen case with gold lettering",
      },
      {
        url: "/images/products/chiselan/vials.jpg",
        alt: "Rows of collagen vials with gold caps",
      },
      {
        url: "/images/products/chiselan/case.jpg",
        alt: "Collagen attache case filled with vials",
      },
    ],
  },
  {
    id: "prod-iron",
    name: "Iron Tablets",
    slug: "iron-tablets",
    tagline: "Iron tablets. Sixty days.",
    description:
      "Iron with folic acid and vitamin C. One tablet a day with food, and keep the tin closed.",
    benefits: [
      "Supports healthy iron levels",
      "Helps maintain everyday energy",
      "Compact sixty-day support",
    ],
    ingredients: ["Elemental iron", "Folic acid", "Vitamin C"],
    usage: "One tablet daily with food, or as your physician advises. Keep the tin closed and dry.",
    price: nairaToKobo(40000),
    sku: "TVS-HERB-IRON-60",
    stock: 40,
    featured: false,
    categorySlug: "daily-essentials",
    images: [
      {
        url: "/images/marketing/cranberry-02.jpg",
        alt: "Herbstrong multidimensional iron tablets",
      },
    ],
  },
  {
    id: "prod-pqq",
    name: "White Tomato PQQ",
    slug: "white-tomato-pqq",
    tagline: "White tomato PQQ. Drink it cold.",
    description:
      "One bottle of white tomato with PQQ and glutathione. Shake it and drink it chilled.",
    benefits: [
      "White tomato botanicals for brightness",
      "Convenient bottled serving",
      "Pairs well with everyday support",
    ],
    ingredients: ["White tomato extract", "PQQ", "Glutathione"],
    usage: "Shake gently and drink chilled. One bottle is a single serving.",
    price: nairaToKobo(40000),
    sku: "TVS-PQQ-WHT-1",
    stock: 12,
    featured: true,
    categorySlug: "daily-rituals",
    images: [
      {
        url: "/images/marketing/chiselan-01.jpg",
        alt: "PQQ white tomato drink bottle and carton",
      },
      {
        url: "/images/products/iron/campaign.jpg",
        alt: "PQQ white tomato drink campaign",
      },
    ],
  },
];

export const infusions: CatalogInfusion[] = [
  {
    id: "iv-glow",
    name: "Glow",
    slug: "glow",
    tagline: "Vitamin C, glutathione, and B-complex.",
    description: "A 60-minute infusion with vitamin C, glutathione, and B-complex in saline.",
    benefits: ["Vitamin C", "Glutathione", "B-complex"],
    ingredients: ["Vitamin C", "Glutathione", "B-complex", "Saline"],
    durationMin: 60,
    price: nairaToKobo(65000),
    deposit: nairaToKobo(20000),
    featured: true,
    image: "/images/products/tomato/held.jpg",
  },
  {
    id: "iv-immunity",
    name: "Immunity",
    slug: "immunity",
    tagline: "Vitamin C, zinc, and B12.",
    description: "A 45-minute infusion with vitamin C, zinc, and B12 in saline.",
    benefits: ["Vitamin C", "Zinc", "B12"],
    ingredients: ["Vitamin C", "Zinc", "B12", "Saline"],
    durationMin: 45,
    price: nairaToKobo(55000),
    deposit: nairaToKobo(20000),
    featured: true,
    image: "/images/products/cranberry/ampoules.jpg",
  },
  {
    id: "iv-recovery",
    name: "Recovery",
    slug: "recovery",
    tagline: "Myers base, magnesium, and B-complex.",
    description: "A 60-minute infusion with a Myers base, magnesium, and B-complex in saline.",
    benefits: ["Myers base", "Magnesium", "B-complex"],
    ingredients: ["Myers cocktail", "Magnesium", "B-complex", "Saline"],
    durationMin: 60,
    price: nairaToKobo(70000),
    deposit: nairaToKobo(20000),
    featured: true,
    image: "/images/lifestyle/table-01.jpg",
  },
  {
    id: "iv-hydration",
    name: "Hydration",
    slug: "hydration",
    tagline: "Lactated Ringer’s and B12.",
    description: "A 40-minute infusion with lactated Ringer’s and vitamin B12 in saline.",
    benefits: ["Lactated Ringer’s", "Vitamin B12"],
    ingredients: ["Lactated Ringer's", "Vitamin B12", "Saline"],
    durationMin: 40,
    price: nairaToKobo(45000),
    deposit: nairaToKobo(15000),
    featured: false,
    image: "/images/products/chiselan/vials.jpg",
  },
  {
    id: "iv-energy",
    name: "Energy",
    slug: "energy",
    tagline: "B12, amino acids, and taurine.",
    description: "A 45-minute infusion with vitamin B12, amino acids, and taurine in saline.",
    benefits: ["Vitamin B12", "Amino acids", "Taurine"],
    ingredients: ["Vitamin B12", "Amino acids", "Taurine", "Saline"],
    durationMin: 45,
    price: nairaToKobo(60000),
    deposit: nairaToKobo(20000),
    featured: true,
    image: "/images/lifestyle/overhead-01.jpg",
  },
  {
    id: "iv-myers",
    name: "Myers",
    slug: "myers",
    tagline: "Magnesium, calcium, B vitamins, and vitamin C.",
    description:
      "A 75-minute Myers infusion with magnesium, calcium, B vitamins, and vitamin C in saline.",
    benefits: ["Magnesium", "Calcium", "B vitamins", "Vitamin C"],
    ingredients: [
      "Magnesium",
      "Calcium",
      "B vitamins",
      "Vitamin C",
      "Saline",
    ],
    durationMin: 75,
    price: nairaToKobo(80000),
    deposit: nairaToKobo(25000),
    featured: false,
    image: "/images/lifestyle/table-03.jpg",
  },
];

export const deliveryZones: CatalogZone[] = majorAbujaAreas.map((area) => ({
  id: `zone-${area.slug}`,
  name: area.name,
  slug: area.slug,
  fee: nairaToKobo(area.price),
  eta: "Abuja delivery",
}));

export const gallery = [
  {
    src: "/images/lifestyle/table-01.jpg",
    alt: "Wellness essentials arranged on a table",
    className: "md:col-span-2 md:row-span-2",
  },
  {
    src: "/images/products/cranberry/held.jpg",
    alt: "Cranberry probiotic box held in the lounge",
  },
  {
    src: "/images/products/tomato/tray.jpg",
    alt: "Tomato extract ampoules on a white tray",
  },
  {
    src: "/images/products/chiselan/lid.jpg",
    alt: "Collagen case opened in gold",
  },
  {
    src: "/images/lifestyle/invitation.jpg",
    alt: "Wellness invitation card",
  },
  {
    src: "/images/lifestyle/overhead-01.jpg",
    alt: "Overhead still of the lounge table",
    className: "md:col-span-2",
  },
];

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getInfusion(slug: string) {
  return infusions.find((infusion) => infusion.slug === slug);
}

export function relatedProducts(slug: string) {
  const current = getProduct(slug);
  if (!current) return products.slice(0, 3);
  return products
    .filter((product) => product.slug !== slug)
    .sort((left, right) =>
      left.categorySlug === current.categorySlug
        ? -1
        : right.categorySlug === current.categorySlug
          ? 1
          : 0,
    )
    .slice(0, 3);
}
