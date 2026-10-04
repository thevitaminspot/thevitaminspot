import "dotenv/config";
import { defineConfig } from "prisma/config";

// prisma generate runs during npm install, before Vercel injects env vars.
// Generating the client does not connect, so a missing URL must not fail the build.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
