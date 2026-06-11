"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "./button";

/** Button bound to a <form> action — shows a spinner & disables while pending. */
export function SubmitButton({
  children,
  pendingText,
  ...props
}: ButtonProps & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || props.disabled} {...props}>
      {pending && <Loader2 className="animate-spin" />}
      {pending ? pendingText ?? "Saving…" : children}
    </Button>
  );
}
