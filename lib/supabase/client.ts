import { createBrowserClient } from "@supabase/ssr";
import { hasSupabase, publicEnv } from "@/lib/env";

export function createSupabaseBrowser() {
  if (!hasSupabase()) return null;
  return createBrowserClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey);
}
