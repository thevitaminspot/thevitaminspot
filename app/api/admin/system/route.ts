import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { tryPrisma } from "@/lib/db";
import { seedCatalog } from "@/lib/seed-catalog";
import { revalidatePath } from "next/cache";

export const instant = false;

export async function GET() {
  try {
    const auth = await requireAdminApi();
    if (!auth.ok) return auth.response;

    const prisma = await tryPrisma();
    if (!prisma) {
      return NextResponse.json({
        database: false,
        products: 0,
        infusions: 0,
        zones: 0,
      });
    }

    const [products, infusions, zones] = await Promise.all([
      prisma.product.count(),
      prisma.infusionService.count(),
      prisma.deliveryZone.count(),
    ]);

    return NextResponse.json({
      database: true,
      products,
      infusions,
      zones,
    });
  } catch (error) {
    console.error("GET /api/admin/system failed:", error);
    return NextResponse.json({ error: "Could not load system state." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdminApi();
    if (!auth.ok) return auth.response;

    let body: { action?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
    }

    if (body.action === "seed-catalogue") {
      const prisma = await tryPrisma();
      if (!prisma) {
        return NextResponse.json(
          { error: "DATABASE_URL is not connected." },
          { status: 503 },
        );
      }
      const result = await seedCatalog(prisma);
      revalidatePath("/shop");
      revalidatePath("/admin");
      revalidatePath("/admin/products");
      revalidatePath("/admin/infusions");
      revalidatePath("/admin/zones");
      revalidatePath("/admin/appointments");
      return NextResponse.json({
        ok: true,
        created: result.created,
      });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    console.error("POST /api/admin/system failed:", error);
    return NextResponse.json({ error: "System action failed." }, { status: 500 });
  }
}
