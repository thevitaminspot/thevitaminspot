/**
 * Remove customer/transactional data. Keeps shop admin catalogue:
 * products, categories, images, infusions, delivery zones, availability rules,
 * blocked dates, and User rows with role ADMIN.
 *
 * Usage: npx tsx prisma/wipe-keep-catalog.ts --confirm
 *
 * Optional: keep specific paid orders / appointments by id:
 *   npx tsx prisma/wipe-keep-catalog.ts --confirm --keep-order=ID --keep-appointment=ID
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const confirm = process.argv.includes("--confirm");
const keepOrderIds = process.argv
  .filter((arg) => arg.startsWith("--keep-order="))
  .map((arg) => arg.slice("--keep-order=".length))
  .filter(Boolean);
const keepAppointmentIds = process.argv
  .filter((arg) => arg.startsWith("--keep-appointment="))
  .map((arg) => arg.slice("--keep-appointment=".length))
  .filter(Boolean);

if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

if (!confirm) {
  console.error(
    "This deletes orders, payments, appointments, contact messages, and customer users.",
  );
  console.error("Catalogue (products, infusions, zones, availability) is kept.");
  console.error("Re-run with: npx tsx prisma/wipe-keep-catalog.ts --confirm");
  console.error(
    "Optional keep flags: --keep-order=ID --keep-appointment=ID (repeatable)",
  );
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  // Keep payments tied to preserved orders/appointments; delete the rest.
  // Use OR of positive matches so NULL FKs are not excluded by SQL NOT IN quirks.
  const payments =
    keepOrderIds.length > 0 || keepAppointmentIds.length > 0
      ? await prisma.payment.deleteMany({
          where: {
            NOT: {
              OR: [
                ...(keepOrderIds.length > 0
                  ? [{ orderId: { in: keepOrderIds } }]
                  : []),
                ...(keepAppointmentIds.length > 0
                  ? [{ appointmentId: { in: keepAppointmentIds } }]
                  : []),
              ],
            },
          },
        })
      : await prisma.payment.deleteMany();

  const orders = await prisma.order.deleteMany({
    where: keepOrderIds.length > 0 ? { id: { notIn: keepOrderIds } } : undefined,
  });

  const appointments = await prisma.appointment.deleteMany({
    where:
      keepAppointmentIds.length > 0
        ? { id: { notIn: keepAppointmentIds } }
        : undefined,
  });

  const contacts = await prisma.contactMessage.deleteMany();
  const customers = await prisma.user.deleteMany({ where: { role: "CUSTOMER" } });

  console.info("Wipe complete (catalogue unchanged):");
  console.info(`  payments:       ${payments.count}`);
  console.info(`  orders:         ${orders.count}`);
  console.info(`  appointments:   ${appointments.count}`);
  console.info(`  contact notes:  ${contacts.count}`);
  console.info(`  customer users: ${customers.count}`);
  if (keepOrderIds.length || keepAppointmentIds.length) {
    console.info(`  kept orders:        ${keepOrderIds.join(", ") || "(none)"}`);
    console.info(`  kept appointments:  ${keepAppointmentIds.join(", ") || "(none)"}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
