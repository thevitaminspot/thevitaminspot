/**
 * Build .env.production from .env for bulk import to Vercel.
 * Usage: node scripts/prepare-vercel-env.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, ".env");
const target = resolve(root, ".env.production");
const productionUrl = "https://www.thevitaminspotltd.com";

if (!existsSync(source)) {
  console.error("Missing .env — copy .env.example and fill in values first.");
  process.exit(1);
}

const lines = readFileSync(source, "utf8").split(/\r?\n/);
const out = [];
const warnings = [];

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;

  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;

  const key = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  if (key === "NEXT_PUBLIC_APP_URL") {
    value = productionUrl;
  }

  if (key.includes("CLERK") && (value.includes("pk_test_") || value.includes("sk_test_"))) {
    warnings.push(`${key} uses Clerk TEST keys — swap to pk_live_/sk_live_ before going live.`);
  }
  if (key.includes("PAYSTACK") && value.includes("_test_")) {
    warnings.push(`${key} uses Paystack TEST keys — swap to live keys before going live.`);
  }

  const needsQuotes = /[\s#"'=]/.test(value);
  out.push(needsQuotes ? `${key}="${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"` : `${key}=${value}`);
}

writeFileSync(target, `${out.join("\n")}\n`, "utf8");

console.log(`Wrote ${out.length} variables to .env.production`);
console.log(`NEXT_PUBLIC_APP_URL set to ${productionUrl}`);
if (warnings.length) {
  console.warn("\nBefore importing to Vercel Production, fix these:");
  for (const warning of warnings) console.warn(`  • ${warning}`);
}
console.log("\nNext:");
console.log("  1. Edit .env.production if needed (live Clerk/Paystack keys)");
console.log("  2. vercel link");
console.log("  3. npm run env:import-vercel");
