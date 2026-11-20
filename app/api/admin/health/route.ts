import { NextResponse } from "next/server";
import { adminEmails } from "@/lib/admin-access";
import { requireAdminApi } from "@/lib/admin-api";
import { tryPrisma } from "@/lib/db";
import { emailConfigStatus } from "@/lib/email";
import { hasClerk, hasPaystack, publicEnv } from "@/lib/env";
import { resolveSiteUrl } from "@/lib/site";

export const instant = false;

type Check = {
  id: string;
  label: string;
  group: "backend" | "config";
  ok: boolean;
  detail: string;
};

function configured(value: string | undefined) {
  return Boolean(value?.trim());
}

function cloudinaryConfigured() {
  const raw = process.env.CLOUDINARY_URL?.trim();
  if (!raw) return false;
  return /^cloudinary:\/\/[^:]+:[^@]+@.+$/.test(raw);
}

export async function GET() {
  try {
    const auth = await requireAdminApi();
    if (!auth.ok) return auth.response;

    const checks: Check[] = [];
    const prisma = await tryPrisma();

    if (!prisma) {
      checks.push({
        id: "db",
        label: "Database connection",
        group: "backend",
        ok: false,
        detail: "DATABASE_URL missing or invalid",
      });
    } else {
      try {
        const started = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        checks.push({
          id: "db",
          label: "Database connection",
          group: "backend",
          ok: true,
          detail: `Neon responded in ${Date.now() - started}ms`,
        });
      } catch (error) {
        checks.push({
          id: "db",
          label: "Database connection",
          group: "backend",
          ok: false,
          detail: error instanceof Error ? error.message : "Query failed",
        });
      }

      try {
        const [products, orders, appointments, zones, messages] = await Promise.all([
          prisma.product.count(),
          prisma.order.count(),
          prisma.appointment.count(),
          prisma.deliveryZone.count({ where: { isActive: true } }),
          prisma.contactMessage.count(),
        ]);
        checks.push({
          id: "shop-data",
          label: "Shop data readable",
          group: "backend",
          ok: true,
          detail: `${products} products · ${orders} orders · ${appointments} bookings · ${zones} delivery zones · ${messages} messages`,
        });
      } catch (error) {
        checks.push({
          id: "shop-data",
          label: "Shop data readable",
          group: "backend",
          ok: false,
          detail: error instanceof Error ? error.message : "Read failed",
        });
      }
    }

    const email = emailConfigStatus();
    const admins = adminEmails();

    const configChecks: Array<[string, string, boolean, string]> = [
      [
        "clerk",
        "Clerk",
        hasClerk(),
        hasClerk()
          ? "Publishable + secret keys present"
          : "Add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY",
      ],
      [
        "admin-email",
        "ADMIN_EMAIL",
        admins.length > 0,
        admins.length > 0 ? admins.join(", ") : "Missing admin login email",
      ],
      [
        "database-url",
        "DATABASE_URL",
        configured(process.env.DATABASE_URL) &&
          Boolean(process.env.DATABASE_URL?.startsWith("postgres")),
        "Pooled Neon URL",
      ],
      [
        "cloudinary",
        "CLOUDINARY_URL",
        cloudinaryConfigured(),
        cloudinaryConfigured()
          ? "Signed uploads available for new product photos"
          : "Needed for new admin image uploads",
      ],
      [
        "paystack-secret",
        "PAYSTACK_SECRET_KEY",
        hasPaystack(),
        hasPaystack() ? "Server payments enabled" : "Needed for checkout and booking deposits",
      ],
      [
        "paystack-public",
        "NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY",
        configured(publicEnv.paystackPublicKey),
        configured(publicEnv.paystackPublicKey)
          ? "Public key present"
          : "Needed for Paystack.js on checkout",
      ],
      [
        "resend-key",
        "RESEND_API_KEY",
        email.configured,
        email.configured
          ? "Transactional email ready"
          : "Needed for order, booking, and contact emails",
      ],
      [
        "resend-from",
        "RESEND_FROM_EMAIL",
        configured(process.env.RESEND_FROM_EMAIL) || email.configured,
        email.from,
      ],
      [
        "app-url",
        "NEXT_PUBLIC_APP_URL",
        configured(process.env.NEXT_PUBLIC_APP_URL),
        resolveSiteUrl(),
      ],
    ];

    for (const [id, label, ok, detail] of configChecks) {
      checks.push({ id, label, group: "config", ok, detail });
    }

    return NextResponse.json({
      ok: checks.every((item) => item.ok),
      checkedAt: new Date().toISOString(),
      checks,
    });
  } catch (error) {
    console.error("GET /api/admin/health failed:", error);
    return NextResponse.json({ error: "Health check failed." }, { status: 500 });
  }
}
