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
  const aspect = brand.mark.width / brand.mark.height;
  const inner = Math.round(size * 0.62);
  const logoH = aspect < 1 ? inner : Math.round(inner / aspect);
  const logoW = aspect < 1 ? Math.round(inner * aspect) : inner;

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
          borderRadius: Math.round(size * 0.18),
          border: `${Math.max(1, Math.round(size * 0.04))}px solid rgba(11, 44, 33, 0.14)`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          width={logoW}
          height={logoH}
          style={{ objectFit: "contain", objectPosition: "center" }}
        />
      </div>
    ),
    { width: size, height: size },
  );
}
