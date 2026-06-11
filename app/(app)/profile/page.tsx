import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AttendanceClient } from "@/components/attendance/attendance-client";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { initials, cn } from "@/lib/utils";
import Link from "next/link";
import { Settings, Shield, User } from "lucide-react";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const currentProfile = await requireProfile();
  const isOwner = currentProfile.role === "owner";
  
  const supabase = createClient();
  
  // Only query punches for staff (since owners don't have punches mapped)
  let punches: any[] = [];
  if (!isOwner) {
    const { data } = await supabase
      .from("attendance_punches")
      .select("*")
      .eq("profile_id", currentProfile.id)
      .order("date", { ascending: false })
      .order("time", { ascending: true });
    punches = data ?? [];
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" subtitle="Manage your account details and view operational records" />

      {/* Profile Details Header Card */}
      <Card className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.02]">
        <div className="flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white text-lg font-bold text-black border-2 border-border">
            {initials(currentProfile.name)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-content-primary">{currentProfile.name}</h2>
              <Badge variant={isOwner ? "fire" : "default"} className="text-[10px] uppercase tracking-wider">
                {currentProfile.role}
              </Badge>
            </div>
            <p className="text-xs text-content-secondary mt-0.5">{currentProfile.email || "No email associated"}</p>
            {!isOwner && (
              <p className="text-[10px] font-mono bg-bg-elevated px-2 py-0.5 rounded border border-border mt-1.5 inline-block text-content-secondary">
                Biometric PIN: {currentProfile.biometric_pin || "Not Mapped"}
              </p>
            )}
          </div>
        </div>

        {isOwner && (
          <div className="flex gap-2 self-start sm:self-auto">
            <Button asChild size="sm" variant="secondary" className="gap-1">
              <Link href="/settings">
                <Settings className="size-3.5" />
                Settings
              </Link>
            </Button>
            <Button asChild size="sm" variant="default" className="gap-1 text-black bg-white">
              <Link href="/attendance">
                <Shield className="size-3.5" />
                Attendance Ledger
              </Link>
            </Button>
          </div>
        )}
      </Card>

      {/* Staff Attendance section (Embedded) */}
      {!isOwner ? (
        <div className="pt-2">
          <AttendanceClient
            staffList={[currentProfile]}
            currentProfile={currentProfile}
            initialPunches={punches}
          />
        </div>
      ) : (
        <Card className="p-6 text-center max-w-md mx-auto mt-8 space-y-3">
          <div className="flex justify-center">
            <div className="bg-fire/15 text-fire rounded-full p-3">
              <User className="size-8" />
            </div>
          </div>
          <h3 className="text-base font-bold text-content-primary">Owner Console</h3>
          <p className="text-xs text-content-secondary leading-relaxed">
            You are logged in as the platform administrator/owner. Biometric logs are not tracked for owner accounts. Use the navigation links to upload staff logs or update configurations.
          </p>
        </Card>
      )}
    </div>
  );
}

// Inline fallback button definition to make it standalone and prevent imports issues
function Button({
  className,
  asChild,
  variant,
  size,
  ...props
}: {
  className?: string;
  asChild?: boolean;
  variant?: "default" | "secondary";
  size?: "sm" | "default";
  children: React.ReactNode;
}) {
  const Comp = asChild ? "span" : "button";
  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border border-border px-3 py-1.5",
        variant === "default" ? "bg-white text-black hover:bg-white/90" : "bg-bg-elevated text-content-primary hover:bg-bg-hover",
        className
      )}
      {...props}
    />
  );
}
