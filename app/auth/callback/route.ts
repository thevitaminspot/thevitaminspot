import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const supabase = await createSupabaseServer();

  if (code && supabase) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL("/account", request.url));
}
