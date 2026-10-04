import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { hasSupabase, publicEnv } from "@/lib/env";

export async function createSupabaseServer() {
  if (!hasSupabase()) return null;
  const cookieStore = await cookies();

  return createServerClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const cookie of cookiesToSet) {
            cookieStore.set(cookie.name, cookie.value, cookie.options);
          }
        } catch {
          // Called from a Server Component. The proxy refreshes the session.
        }
      },
    },
  });
}

export async function getSessionUser() {
  const supabase = await createSupabaseServer();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}
