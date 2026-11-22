import { ImageResponse } from "next/og";

export const alt = "The Vitamin Spot · Vitamin packs & IV drips in Abuja";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "68px 76px",
          background:
            "radial-gradient(circle at 85% 20%, #174937 0%, #0b2c21 55%, #071e16 100%)",
          color: "#f4efe4",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 18,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: "#cfe1af",
            fontFamily: "sans-serif",
          }}
        >
          <span>ABUJA · SHOP &amp; IV LOUNGE</span>
          <span>thevitaminspotltd.com</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 880 }}>
          <div
            style={{
              fontSize: 78,
              lineHeight: 1.04,
              letterSpacing: "-0.025em",
              color: "#f4efe4",
            }}
          >
            The Vitamin Spot
          </div>
          <div
            style={{
              fontSize: 30,
              lineHeight: 1.4,
              color: "rgba(244, 239, 228, 0.82)",
              fontFamily: "sans-serif",
            }}
          >
            Daily vitamin packs delivered across Abuja &amp; nurse-led IV drips in our CBD lounge.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 28,
            borderTop: "1px solid rgba(244, 239, 228, 0.16)",
            fontSize: 20,
            color: "#e6d7b8",
            fontFamily: "sans-serif",
          }}
        >
          <span>Theodak Plaza, Central Business District, Abuja</span>
          <span>Walk-ins &amp; Online Booking</span>
        </div>
      </div>
    ),
    size,
  );
}
