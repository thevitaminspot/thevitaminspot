"use client";

import { Toaster } from "sonner";

/** Brand-matched toasts — bottom-right for storefront and admin. */
export function SiteToaster() {
  return (
    <Toaster
      theme="light"
      position="bottom-right"
      closeButton
      duration={4500}
      visibleToasts={3}
      gap={10}
      offset={{ bottom: "1.25rem", right: "1rem" }}
      mobileOffset={{ bottom: "1rem", right: "0.75rem" }}
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
