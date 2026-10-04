import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

export function hasDatabase() {
  const url = process.env.DATABASE_URL ?? "";
  return url.startsWith("postgres") && !url.includes("USER:PASSWORD");
}

export function getPrisma(): PrismaClient {
  globalForPrisma.prisma ??= createPrismaClient();
  return globalForPrisma.prisma;
}

export async function tryPrisma() {
  if (!hasDatabase()) return null;
  try {
    return getPrisma();
  } catch {
    return null;
  }
}
