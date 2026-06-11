import { requireProfile } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  return (
    <AppShell role={profile.role} name={profile.name}>
      {children}
    </AppShell>
  );
}
