import {
  categories,
  deliveryZones,
  infusions,
  products,
  testimonials,
} from "./catalog";
import type { PrismaClient } from "./generated/prisma/client";

export async function seedCatalog(prisma: PrismaClient) {
  let created = 0;

  for (const zone of deliveryZones) {
    const existing = await prisma.deliveryZone.findUnique({ where: { slug: zone.slug } });
    if (existing) continue;
    await prisma.deliveryZone.create({ data: zone });
    created += 1;
  }

  for (const category of categories) {
    const existing = await prisma.productCategory.findUnique({ where: { slug: category.slug } });
    if (existing) continue;
    await prisma.productCategory.create({ data: category });
    created += 1;
  }

  for (const product of products) {
    const existing = await prisma.product.findUnique({ where: { slug: product.slug } });
    if (existing) continue;
    const category = await prisma.productCategory.findUniqueOrThrow({
      where: { slug: product.categorySlug },
    });
    await prisma.product.create({
      data: {
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
    created += 1;
  }

  for (const infusion of infusions) {
    const existing = await prisma.infusionService.findUnique({ where: { slug: infusion.slug } });
    if (existing) continue;
    await prisma.infusionService.create({
      data: {
        ...infusion,
        isActive: infusion.isActive ?? true,
      },
    });
    created += 1;
  }

  for (const testimonial of testimonials) {
    const existing = await prisma.testimonial.findUnique({ where: { id: testimonial.id } });
    if (existing) continue;
    await prisma.testimonial.create({ data: testimonial });
    created += 1;
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
      update: {},
      create: {
        weekday,
        startMin: 600,
        endMin: 1080,
        slotMin: 45,
        bufferMin: 15,
      },
    });
  }

  return { created };
}
