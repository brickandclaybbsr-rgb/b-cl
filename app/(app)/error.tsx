"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-danger/15 text-danger">
        <AlertTriangle className="size-7" />
      </div>
      <h1 className="font-display text-xl font-bold">Something went wrong</h1>
      <p className="mt-1 max-w-sm text-sm text-content-secondary">
        We hit an unexpected error loading this screen. Try again, or sign out
        and back in.
      </p>
      <Button onClick={reset} className="mt-5">
        <RotateCcw className="size-4" /> Try again
      </Button>
    </div>
  );
}
