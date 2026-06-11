"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: string };

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/") || "/";

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Invalid email or password. Please try again." };
  }

  // Block deactivated accounts.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_active")
      .eq("id", user.id)
      .single();
    if (profile && profile.is_active === false) {
      await supabase.auth.signOut();
      return { error: "This account has been deactivated. Contact the owner." };
    }
  }

  redirect(next.startsWith("/") ? next : "/");
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
