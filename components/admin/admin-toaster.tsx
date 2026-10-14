"use client";

import { Toaster } from "sonner";

export function AdminToaster() {
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      duration={5000}
      toastOptions={{
        classNames: {
          toast: "font-sans text-sm shadow-md",
        },
      }}
    />
  );
}
