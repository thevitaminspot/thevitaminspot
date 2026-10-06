export const brand = {
  name: "The Vitamin Spot",
  /** Pin icon only — nav, footer, favicon-style uses */
  mark: {
    src: "/brand/logo.png",
    alt: "The Vitamin Spot",
    width: 495,
    height: 495,
  },
  /** Full logo with wordmark — Open Graph and structured data */
  logo: {
    src: "/brand/logo.jpg",
    alt: "The Vitamin Spot",
    width: 495,
    height: 648,
  },
  colors: {
    primary: "#8BA575",
    deep: "#0B2C21",
    tint: "#CFE1AF",
    cream: "#F4EFE4",
    ink: "#08150F",
  },
} as const;
