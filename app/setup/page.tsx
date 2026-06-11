import Link from "next/link";
import { Database, KeyRound, MessageCircle, Rocket } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Card } from "@/components/ui/card";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const metadata = { title: "Setup" };

const steps = [
  {
    icon: Database,
    title: "1 · Create a Supabase project",
    body: "Run supabase/schema.sql then supabase/seed.sql in the SQL editor. This creates all tables, RLS policies and seed data.",
  },
  {
    icon: KeyRound,
    title: "2 · Add environment variables",
    body: "Copy .env.example to .env.local and fill NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY. Restart the dev server.",
  },
  {
    icon: KeyRound,
    title: "3 · Create the owner account",
    body: "In Supabase Auth, add a user. Then in SQL: update profiles set role='owner' where id='<that user id>'. Add up to 5 staff the same way (or via Settings once signed in).",
  },
  {
    icon: MessageCircle,
    title: "4 · WhatsApp (optional, for EOD report)",
    body: "Add WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID and OWNER_WHATSAPP_NUMBER from Meta Cloud API to enable the 11 PM IST daily report.",
  },
  {
    icon: Rocket,
    title: "5 · Deploy",
    body: "Push to Vercel, add the same env vars, set the custom domain ops.brickandclay.in, and the cron in vercel.json fires the report at 11 PM IST.",
  },
];

export default function SetupPage() {
  const configured = hasSupabaseEnv();
  return (
    <main className="container-app py-10">
      <BrandLogo className="mb-8" />
      <h1 className="font-display text-2xl font-bold">Welcome to B&amp;C Ops</h1>
      <p className="mt-1 text-content-secondary">
        A few steps to get your operations platform running.
      </p>

      {configured && (
        <div className="mt-4 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          ✅ Supabase is configured.{" "}
          <Link href="/login" className="font-semibold underline">
            Go to sign in →
          </Link>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {steps.map((s) => (
          <Card key={s.title} className="p-4">
            <div className="flex gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-fire/15 text-fire">
                <s.icon className="size-5" />
              </div>
              <div>
                <h2 className="font-display text-base font-semibold">
                  {s.title}
                </h2>
                <p className="mt-0.5 text-sm text-content-secondary">{s.body}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <p className="mt-6 text-sm text-content-secondary">
        Full details are in <code className="text-warm">README.md</code>.
      </p>
    </main>
  );
}
