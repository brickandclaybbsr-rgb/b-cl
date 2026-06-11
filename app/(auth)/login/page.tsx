import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { LoginForm } from "./login-form";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const metadata = { title: "Sign in" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  const next = searchParams.next ?? "/";
  const configured = hasSupabaseEnv();

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 py-10">
      {/* subtle ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(55% 45% at 50% 0%, rgba(255,255,255,0.06), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.4]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage:
            "radial-gradient(60% 50% at 50% 30%, black, transparent 75%)",
        }}
      />

      <div className="w-full max-w-sm animate-fade-in-up">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandLogo height={46} className="mb-5" />
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-content-secondary">
            Operations Platform
          </p>
        </div>

        <div className="surface p-6">
          {searchParams.error === "inactive" && (
            <p className="mb-4 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
              Your account is inactive. Please contact the owner.
            </p>
          )}

          {configured ? (
            <LoginForm next={next} />
          ) : (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <AlertTriangle className="size-8 text-warning" />
              <p className="font-display text-base font-semibold">
                Setup required
              </p>
              <p className="text-sm text-content-secondary">
                Supabase isn&apos;t configured yet. Add your{" "}
                <code className="rounded bg-bg-elevated px-1 text-warm">
                  .env.local
                </code>{" "}
                values and restart the dev server.
              </p>
              <Link
                href="/setup"
                className="text-sm font-semibold text-fire hover:underline"
              >
                View setup guide →
              </Link>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-content-secondary">
          SS Brick & Clay (Pvt.) Ltd
        </p>
      </div>
    </main>
  );
}
