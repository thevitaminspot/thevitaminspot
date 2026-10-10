import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { brand } from "@/lib/brand";

let logoDataUrl: string | null = null;

async function logoSrc() {
  if (logoDataUrl) return logoDataUrl;
  const file = path.join(process.cwd(), "public", brand.mark.src.replace(/^\//, ""));
  const buffer = await readFile(file);
  logoDataUrl = `data:image/png;base64,${buffer.toString("base64")}`;
  return logoDataUrl;
}

export async function brandIconImage(size: number) {
  const src = await logoSrc();
  const { cream } = brand.colors;
  const pad = Math.round(size * 0.12);
  const logoH = size - pad * 2;
  const logoW = Math.round(logoH * (brand.mark.width / brand.mark.height));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: cream,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" width={logoW} height={logoH} style={{ objectFit: "contain" }} />
      </div>
    ),
    { width: size, height: size },
  );
}
