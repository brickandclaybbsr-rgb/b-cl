"use client";

import { Toaster as Sonner } from "sonner";

/** App-wide toast portal, themed to the warm palette. */
export function Toaster() {
  return (
    <Sonner
      position="top-center"
      richColors
      toastOptions={{
        style: {
          background: "#1A1714",
          border: "1px solid #2E2922",
          color: "#F5F0E8",
        },
      }}
    />
  );
}
