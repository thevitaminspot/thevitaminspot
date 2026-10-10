/**
 * Remove customer/transactional data. Keeps shop admin catalogue:
 * products, categories, images, infusions, delivery zones, availability rules,
 * blocked dates, and User rows with role ADMIN.
 *
 * Usage: npx tsx prisma/wipe-keep-catalog.ts --confirm
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const confirm = process.argv.includes("--confirm");

if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

if (!confirm) {
  console.error("This deletes orders, payments, appointments, contact messages, testimonials, and customer users.");
  console.error("Catalogue (products, infusions, zones, availability) is kept.");
  console.error("Re-run with: npx tsx prisma/wipe-keep-catalog.ts --confirm");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const payments = await prisma.payment.deleteMany();
  const orders = await prisma.order.deleteMany();
  const appointments = await prisma.appointment.deleteMany();
  const contacts = await prisma.contactMessage.deleteMany();
  const testimonials = await prisma.testimonial.deleteMany();
  const customers = await prisma.user.deleteMany({ where: { role: "CUSTOMER" } });

  const counts = {
    payments: payments.count,
    orders: orders.count,
    appointments: appointments.count,
    contacts: contacts.count,
    testimonials: testimonials.count,
    customers: customers.count,
  };

  console.info("Wipe complete (catalogue unchanged):");
  console.info(`  payments:      ${counts.payments}`);
  console.info(`  orders:        ${counts.orders}`);
  console.info(`  appointments:  ${counts.appointments}`);
  console.info(`  contact notes: ${counts.contacts}`);
  console.info(`  testimonials:  ${counts.testimonials}`);
  console.info(`  customer users:${counts.customers}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
