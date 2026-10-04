import { PrismaPg } from "@prisma/adapter-pg";
import {
  categories,
  deliveryZones,
  infusions,
  products,
  testimonials,
} from "../lib/catalog";
import { PrismaClient } from "../lib/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  for (const zone of deliveryZones) {
    await prisma.deliveryZone.upsert({
      where: { slug: zone.slug },
      update: zone,
      create: zone,
    });
  }

  for (const category of categories) {
    await prisma.productCategory.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }

  for (const product of products) {
    const category = await prisma.productCategory.findUniqueOrThrow({
      where: { slug: product.categorySlug },
    });

    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        tagline: product.tagline,
        description: product.description,
        benefits: product.benefits,
        ingredients: product.ingredients,
        usage: product.usage,
        price: product.price,
        sku: product.sku,
        stock: product.stock,
        featured: product.featured,
        categoryId: category.id,
        images: {
          deleteMany: {},
          create: product.images.map((image, position) => ({
            url: image.url,
            alt: image.alt,
            position,
          })),
        },
      },
      create: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        tagline: product.tagline,
        description: product.description,
        benefits: product.benefits,
        ingredients: product.ingredients,
        usage: product.usage,
        price: product.price,
        sku: product.sku,
        stock: product.stock,
        featured: product.featured,
        categoryId: category.id,
        images: {
          create: product.images.map((image, position) => ({
            url: image.url,
            alt: image.alt,
            position,
          })),
        },
      },
    });
  }

  for (const infusion of infusions) {
    await prisma.infusionService.upsert({
      where: { slug: infusion.slug },
      update: infusion,
      create: infusion,
    });
  }

  for (const testimonial of testimonials) {
    await prisma.testimonial.upsert({
      where: { id: testimonial.id },
      update: testimonial,
      create: testimonial,
    });
  }

  for (const weekday of [1, 2, 3, 4, 5, 6]) {
    await prisma.availabilityRule.upsert({
      where: {
        weekday_startMin_endMin: {
          weekday,
          startMin: 600,
          endMin: 1080,
        },
      },
      update: { slotMin: 45, bufferMin: 15, isActive: true },
      create: {
        weekday,
        startMin: 600,
        endMin: 1080,
        slotMin: 45,
        bufferMin: 15,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
