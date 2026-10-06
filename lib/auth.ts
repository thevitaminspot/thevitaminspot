import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { adminEmails } from "@/lib/admin-access";
import { tryPrisma } from "@/lib/db";
import { hasClerk } from "@/lib/env";

export { hasClerk };

export type SessionProfile = {
  clerkId: string;
  email: string;
  name?: string;
};

export async function getSessionProfile(): Promise<SessionProfile | null> {
  if (!hasClerk()) return null;
  const { userId } = await auth();
  if (!userId) return null;
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  if (!user || !email) return null;
  return {
    clerkId: user.id,
    email,
    name: user.fullName ?? user.firstName ?? undefined,
  };
}

export async function isAdmin() {
  if (!hasClerk()) return false;
  const { userId } = await auth();
  if (!userId) return false;
  const user = await currentUser();
  if (!user) return false;
  if (user.publicMetadata?.role === "admin") return true;
  const email = user.primaryEmailAddress?.emailAddress?.toLowerCase();
  return Boolean(email && adminEmails().includes(email));
}

export async function getAdminProfile() {
  if (!(await isAdmin())) return null;
  return getSessionProfile();
}

export async function attachCustomer(profile: SessionProfile | null) {
  if (!profile) return undefined;
  const prisma = await tryPrisma();
  if (!prisma) return undefined;
  const user = await prisma.user.upsert({
    where: { email: profile.email },
    update: { clerkId: profile.clerkId, name: profile.name },
    create: {
      email: profile.email,
      name: profile.name,
      clerkId: profile.clerkId,
      role: adminEmails().includes(profile.email.toLowerCase()) ? "ADMIN" : "CUSTOMER",
    },
  });
  return { connect: { id: user.id } };
}
