import "server-only";
import { NextResponse } from "next/server";
import { getAdminProfile } from "@/lib/auth";

export async function requireAdminApi() {
  const admin = await getAdminProfile();
  if (!admin) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }
  return { ok: true as const, admin };
}
