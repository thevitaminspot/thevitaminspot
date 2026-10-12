/**
 * Regenerate the owner handover Word doc from docs/handover/owner-guide.md
 * Usage: node scripts/generate-handover-docx.mjs
 */
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const handover = resolve(root, "docs/handover");
const outDir = resolve(handover, "docx");
const input = resolve(handover, "owner-guide.md");
const output = resolve(outDir, "The-Vitamin-Spot-Owner-Handover.docx");

mkdirSync(outDir, { recursive: true });

execFileSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["@mohtasham/md-to-docx", input, output],
  { cwd: root, stdio: "inherit" },
);

console.log(`\nWrote ${output}`);
