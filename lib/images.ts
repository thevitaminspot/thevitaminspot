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

const ALLOWED_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_UPLOAD_BYTES = 4_500_000;

function detectImageMime(bytes: Buffer): string | null {
  if (bytes.length < 12) return null;
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  // WebP: RIFF....WEBP
  if (
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  // GIF87a / GIF89a
  const gif = bytes.subarray(0, 6).toString("ascii");
  if (gif === "GIF87a" || gif === "GIF89a") {
    return "image/gif";
  }
  return null;
}

function isUploadableImage(file: { type?: string; name?: string; size: number }) {
  if (file.size <= 0) return false;
  if (file.type) return ALLOWED_MIMES.has(file.type.toLowerCase());
  return /\.(jpe?g|png|webp|gif)$/i.test(file.name || "");
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
    return { error: "Choose a JPG, PNG, WebP, or GIF image." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { error: "Image must be under 4.5MB." };
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length === 0) {
    return { error: "That image file was empty. Try another picture." };
  }
  if (bytes.length > MAX_UPLOAD_BYTES) {
    return { error: "Image must be under 4.5MB." };
  }

  const mime = detectImageMime(bytes);
  if (!mime) {
    return { error: "That file is not a valid JPG, PNG, WebP, or GIF image." };
  }

  // Data URI avoids Node FormData File streaming quirks with Cloudinary.
  const dataUri = `data:${mime};base64,${bytes.toString("base64")}`;

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "thevitaminspot";
  const allowedFormats = "jpg,png,webp,gif";
  const signature = createHash("sha1")
    .update(`allowed_formats=${allowedFormats}&folder=${folder}&timestamp=${timestamp}${config.apiSecret}`)
    .digest("hex");

  const body = new FormData();
  body.append("file", dataUri);
  body.append("api_key", config.apiKey);
  body.append("timestamp", String(timestamp));
  body.append("signature", signature);
  body.append("folder", folder);
  body.append("allowed_formats", allowedFormats);

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
