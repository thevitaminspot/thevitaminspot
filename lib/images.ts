import "server-only";
import { createHash } from "node:crypto";

function cloudinaryConfig() {
  const raw = process.env.CLOUDINARY_URL?.trim();
  if (!raw) return null;
  const match = raw.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
  if (!match) return null;
  return {
    apiKey: decodeURIComponent(match[1]),
    apiSecret: decodeURIComponent(match[2]),
    cloudName: match[3],
  };
}

function guessMime(file: { type?: string; name?: string }) {
  if (file.type && file.type.startsWith("image/")) return file.type;
  const name = (file.name || "").toLowerCase();
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".gif")) return "image/gif";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  return "image/jpeg";
}

function isUploadableImage(file: { type?: string; name?: string; size: number }) {
  if (file.size <= 0) return false;
  if (file.type?.startsWith("image/")) return true;
  if (!file.type) {
    return /\.(jpe?g|png|webp|gif)$/i.test(file.name || "");
  }
  return false;
}

/** Accept File-like values from Server Action FormData (avoid brittle instanceof). */
export function asUploadFile(value: FormDataEntryValue | null) {
  if (!value || typeof value === "string") return null;
  const candidate = value as Blob & { name?: string; type: string; size: number };
  if (typeof candidate.arrayBuffer !== "function" || typeof candidate.size !== "number") {
    return null;
  }
  return candidate;
}

export async function uploadImage(file: Blob & { name?: string; type: string; size: number }) {
  const config = cloudinaryConfig();
  if (!config) {
    return { error: "Add CLOUDINARY_URL to upload pictures." };
  }
  if (!isUploadableImage(file)) {
    return { error: "Choose a JPG, PNG, or WebP image." };
  }
  if (file.size > 8_000_000) {
    return { error: "Image must be under 8MB." };
  }

  const mime = guessMime(file);
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length === 0) {
    return { error: "That image file was empty. Try another picture." };
  }

  // Data URI avoids Node FormData File streaming quirks with Cloudinary.
  const dataUri = `data:${mime};base64,${bytes.toString("base64")}`;

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "thevitaminspot";
  const signature = createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${config.apiSecret}`)
    .digest("hex");

  const body = new FormData();
  body.append("file", dataUri);
  body.append("api_key", config.apiKey);
  body.append("timestamp", String(timestamp));
  body.append("signature", signature);
  body.append("folder", folder);

  let response: Response;
  try {
    response = await fetch(
      `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
      { method: "POST", body },
    );
  } catch {
    return { error: "Could not reach Cloudinary. Check the network and try again." };
  }

  const payload = (await response.json().catch(() => ({}))) as {
    secure_url?: string;
    error?: { message?: string };
  };

  if (!response.ok || !payload.secure_url) {
    return {
      error: payload.error?.message ?? "Cloudinary could not store that image.",
    };
  }

  return { url: payload.secure_url };
}
