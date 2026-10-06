import { ImageResponse } from "next/og";
import { brand } from "@/lib/brand";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  const { deep, tint, cream } = brand.colors;

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
        <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
          <path
            d="M16 3C11.03 3 7 7.03 7 12c0 6.75 9 17 9 17s9-10.25 9-17c0-4.97-4.03-9-9-9z"
            fill={tint}
            stroke={deep}
            strokeWidth="1.75"
          />
          <circle cx="16" cy="12" r="2.2" fill={deep} />
          <path
            d="M13.5 24.5c0-1.1.9-2 2.5-2s2.5.9 2.5 2"
            stroke={deep}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M14 26.5c.8.6 1.7.9 2 .9s1.2-.3 2-.9"
            stroke={deep}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
