import "server-only";
import { cache } from "react";
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

type CachedClerkAuth = {
  profile: SessionProfile;
  isAdmin: boolean;
} | null;

const loadClerkAuth = cache(async (): Promise<CachedClerkAuth> => {
  if (!hasClerk()) return null;
  const { userId } = await auth();
  if (!userId) return null;
  const user = await currentUser();
  if (!user) return null;

  const primary = user.primaryEmailAddress;
  const verifiedPrimary =
    primary?.verification?.status === "verified" ? primary.emailAddress : undefined;
  const fallbackVerified = user.emailAddresses.find(
    (entry) => entry.verification?.status === "verified",
  )?.emailAddress;
  const email = verifiedPrimary ?? fallbackVerified;
  if (!email) return null;

  const normalizedPrimary = verifiedPrimary?.toLowerCase();
  const isAdminUser =
    user.publicMetadata?.role === "admin" ||
    Boolean(normalizedPrimary && adminEmails().includes(normalizedPrimary));

  return {
    profile: {
      clerkId: user.id,
      email,
      name: user.fullName ?? user.firstName ?? undefined,
    },
    isAdmin: isAdminUser,
  };
});

export async function getSessionProfile(): Promise<SessionProfile | null> {
  const session = await loadClerkAuth();
  return session?.profile ?? null;
}

export async function isAdmin() {
  const session = await loadClerkAuth();
  return session?.isAdmin ?? false;
}

export async function getAdminProfile() {
  const session = await loadClerkAuth();
  return session?.isAdmin ? session.profile : null;
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
