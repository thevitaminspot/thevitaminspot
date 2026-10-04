import { getSessionUser } from "@/lib/supabase/server";

export async function getAdminUser() {
  const user = await getSessionUser();
  if (user) return user;

  return {
    id: "local-preview",
    email: "preview@localhost",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "",
  };
}
