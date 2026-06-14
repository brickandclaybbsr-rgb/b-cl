import { requireProfile, isHeadChef } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import { NativeBootstrap } from "@/components/native-bootstrap";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  return (
    <AppShell role={profile.role} name={profile.name} team={profile.team ?? null} isHeadChef={isHeadChef(profile)}>
      <NativeBootstrap />
      {children}
    </AppShell>
  );
}
