import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand-logo";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <BrandMark size={52} />
      <h1 className="mt-5 font-display text-3xl font-bold">Page not found</h1>
      <p className="mt-1 text-sm text-content-secondary">
        That page doesn&apos;t exist in B&amp;C Ops.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Back to home</Link>
      </Button>
    </main>
  );
}
