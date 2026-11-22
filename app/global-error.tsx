"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
          backgroundColor: "#f4efe4",
          color: "#0b2c21",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: "460px",
            width: "100%",
            backgroundColor: "#ffffff",
            border: "1px solid rgba(11, 44, 33, 0.12)",
            borderRadius: "16px",
            padding: "36px 28px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "11px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              opacity: 0.6,
            }}
          >
            The Vitamin Spot
          </p>
          <h1
            style={{
              margin: "12px 0 0",
              fontSize: "28px",
              fontWeight: 500,
              fontFamily: "Georgia, serif",
            }}
          >
            Something went wrong
          </h1>
          <p style={{ margin: "12px 0 0", fontSize: "14px", lineHeight: 1.6, opacity: 0.75 }}>
            An unexpected error interrupted this page. Reload to try again.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "24px",
              backgroundColor: "#0b2c21",
              color: "#f4efe4",
              border: "none",
              borderRadius: "9999px",
              padding: "12px 24px",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
