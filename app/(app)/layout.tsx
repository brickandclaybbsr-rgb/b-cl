import { requireProfile } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import { NativeBootstrap } from "@/components/native-bootstrap";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  return (
    <AppShell role={profile.role} name={profile.name}>
      <NativeBootstrap />
      {children}
    </AppShell>
  );
}
