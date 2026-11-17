/** Client-side prep so admin uploads stay under Server Action / Vercel body limits. */

const MAX_EDGE_PX = 2000;
const TARGET_BYTES = 3_200_000;

function extensionLooksLikeImage(name: string) {
  return /\.(jpe?g|png|webp|gif)$/i.test(name);
}

function isHeic(file: File) {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return (
    type.includes("heic") ||
    type.includes("heif") ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
}

async function encodeJpeg(
  source: CanvasImageSource,
  width: number,
  height: number,
  name: string,
  quality: number,
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare that image in this browser.");
  ctx.drawImage(source, 0, 0, width, height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("Could not compress that image."))),
      "image/jpeg",
      quality,
    );
  });

  const base = name.replace(/\.[^.]+$/, "") || "upload";
  return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
}

export async function prepareImageForUpload(file: File): Promise<File> {
  if (isHeic(file)) {
    throw new Error("HEIC photos aren’t supported here. Export as JPG or PNG and try again.");
  }

  if (!file.type.startsWith("image/") && !extensionLooksLikeImage(file.name)) {
    throw new Error("Choose a JPG, PNG, or WebP image.");
  }

  if (file.size === 0) {
    throw new Error("That image file was empty. Try another picture.");
  }

  // Small enough already — keep original encoding.
  if (
    file.size <= TARGET_BYTES &&
    (file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp")
  ) {
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Could not read that image. Try a JPG or PNG instead.");
  }

  const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  let quality = 0.86;
  let prepared = await encodeJpeg(bitmap, width, height, file.name, quality);
  bitmap.close();

  while (prepared.size > TARGET_BYTES && quality > 0.55) {
    quality -= 0.1;
    const again = await createImageBitmap(prepared);
    prepared = await encodeJpeg(again, again.width, again.height, file.name, quality);
    again.close();
  }

  if (prepared.size > 7_500_000) {
    throw new Error("That picture is still too large after compressing. Try a smaller file.");
  }

  return prepared;
}
