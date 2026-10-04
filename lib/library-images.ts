import { readdir } from "node:fs/promises";
import path from "node:path";

export async function listLibraryImages() {
  const root = path.join(process.cwd(), "public/images");
  const found: string[] = [];

  async function walk(dir: string) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (/\.(jpe?g|png|webp)$/i.test(entry.name)) {
        found.push(`/images/${path.relative(root, full).split(path.sep).join("/")}`);
      }
    }
  }

  await walk(root);
  return found.sort();
}
