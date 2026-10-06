import "server-only";
import { notFound, redirect } from "next/navigation";
import { getAdminProfile, getSessionProfile, hasClerk } from "@/lib/auth";
import type { SessionProfile } from "@/lib/auth";

export async function getAdminUser() {
  return getAdminProfile();
}

export async function requireAdmin(): Promise<SessionProfile> {
  if (!hasClerk()) notFound();
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  const admin = await getAdminProfile();
  if (!admin) redirect("/account");
  return admin;
}
