import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentProfile } from "@/lib/auth";

export default async function Home() {
  if (!hasSupabaseEnv()) redirect("/setup");

  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  redirect(profile.role === "owner" ? "/owner" : "/dashboard");
}
