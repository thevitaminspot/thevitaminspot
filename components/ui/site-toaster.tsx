"use client";

import { Toaster } from "sonner";

/** Brand-matched toasts — top-right clears the cookie bar and mobile CTAs. */
export function SiteToaster() {
  return (
    <Toaster
      theme="light"
      position="top-right"
      closeButton
      duration={4500}
      visibleToasts={3}
      gap={10}
      offset={{ top: "5.5rem", right: "1rem" }}
      mobileOffset={{ top: "5rem", right: "0.75rem" }}
      className="tvs-toaster"
      toastOptions={{
        classNames: {
          toast: "tvs-toast",
          title: "tvs-toast-title",
          description: "tvs-toast-description",
          closeButton: "tvs-toast-close",
          success: "tvs-toast-success",
          error: "tvs-toast-error",
          info: "tvs-toast-info",
          warning: "tvs-toast-warning",
        },
      }}
    />
  );
}
