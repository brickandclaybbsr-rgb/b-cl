"use client";

import { LogOut } from "lucide-react";
import { signOut } from "@/app/(auth)/login/actions";
import { cn } from "@/lib/utils";

export function SignOutButton({
  className,
  label = "Sign out",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-content-secondary transition-colors hover:bg-bg-elevated hover:text-danger",
          className,
        )}
      >
        <LogOut className="size-4" />
        {label}
      </button>
    </form>
  );
}
