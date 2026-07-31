import { AlertTriangle, MessageCircle, Settings, Shield, User, Bell, CalendarClock } from "lucide-react";
import { requireProfile, isHeadChef } from "@/lib/auth";
import { getStaff, getProfileNameMap } from "@/lib/data/profiles";
import { getMyAttendance } from "@/lib/data/attendance";
import { MyAttendanceHistory } from "@/components/attendance/my-attendance";
import { getAllStockItems } from "@/lib/data/stock";
import { getAllVendors } from "@/lib/data/vendors";
import { getAllChecklistItems, getAppSetting } from "@/lib/data/settings";
import { hasServiceRole } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { AttendanceClient } from "@/components/attendance/attendance-client";
import { ProfileClient } from "@/components/profile/profile-client";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { initials, cn } from "@/lib/utils";
import Link from "next/link";
import { SettingsTabs } from "@/components/settings/tabs";
import { ScheduleClient } from "@/app/(app)/notifications/schedule-client";
import { SendNotificationForm } from "@/app/(app)/notifications/send-form";
import {
  AddStaffForm,
  AddStockItemForm,
  AddVendorForm,
  AddChecklistItemForm,
  WhatsAppForm,
  OwnerSignatureForm,
} from "@/components/settings/forms";
import {
  ToggleActive,
  DeleteRow,
  ResetPassword,
  BiometricMappingForm,
} from "@/components/settings/controls";
import { SendReportButton } from "@/components/send-report-button";
import {
  setStaffActive,
  sendPasswordReset,
  toggleStockItem,
  deleteStockItem,
  toggleVendor,
  deleteVendor,
  toggleChecklistItem,
  deleteChecklistItem,
} from "../settings/actions";

export const metadata = { title: "Profile & Settings" };

export default async function ProfilePage() {
  const currentProfile = await requireProfile();
  const isOwner = currentProfile.role === "owner";
  
  const supabase = createClient();
  
  // Staff variables
  let punches: any[] = [];
  let leaves: any[] = [];
  let documents: any[] = [];
  // Head chef gets a read-only view of everyone's leave requests.
  const headChef = isHeadChef(currentProfile);
  // Staff see their own attendance history. Owners don't use QR check-in, and
  // house helpers are paid daily in cash without attendance records at all.
  const myAttendance = currentProfile.role === "staff" && !currentProfile.is_house_helper
    ? await getMyAttendance(currentProfile.id, 120).catch(() => null)
    : null;
  let allLeaves: any[] = [];
  let staffNames: Record<string, string> = {};

  // Settings variables
  let staff: any[] = [];
  let stock: any[] = [];
  let vendors: any[] = [];
  let opening: any[] = [];
  let closing: any[] = [];
  let ownerWa: string | null = null;
  let punchoutEnabled = true;
  let tasksEnabled = true;

  if (!isOwner) {
    const { data: punchesData } = await supabase
      .from("attendance_punches")
      .select("*")
      .eq("profile_id", currentProfile.id)
      .order("date", { ascending: false })
      .order("time", { ascending: true });
    punches = punchesData ?? [];

    try {
      const { data: leavesData, error: leavesErr } = await supabase
        .from("leaves")
        .select("*")
        .eq("profile_id", currentProfile.id)
        .order("submitted_at", { ascending: false });
      if (!leavesErr && leavesData) {
        leaves = leavesData;
      }
    } catch (err) {
      console.warn("Failed to fetch leaves (table may not exist yet):", err);
    }

    try {
      const { data: docsData, error: docsErr } = await supabase
        .from("staff_documents")
        .select("*")
        .eq("profile_id", currentProfile.id)
        .eq("is_visible_to_staff", true)
        .order("uploaded_at", { ascending: false });
      if (!docsErr && docsData) {
        documents = docsData;
      }
    } catch (err) {
      console.warn("Failed to fetch staff documents (table may not exist yet):", err);
    }

    if (headChef) {
      try {
        const [{ data: allLeavesData }, nameMap] = await Promise.all([
          supabase.from("leaves").select("*").order("submitted_at", { ascending: false }),
          getProfileNameMap(),
        ]);
        allLeaves = allLeavesData ?? [];
        staffNames = nameMap;
      } catch (err) {
        console.warn("Failed to fetch all leaves for head chef:", err);
      }
    }

  } else {
    // Fetch all configuration settings for Owner
    const [staffData, stockData, vendorsData, openingData, closingData, ownerWaData, punchoutData, tasksData] = await Promise.all([
      getStaff(),
      getAllStockItems(),
      getAllVendors(),
      getAllChecklistItems("opening"),
      getAllChecklistItems("closing"),
      getAppSetting("owner_whatsapp_number"),
      getAppSetting("notify_punchout_enabled"),
      getAppSetting("notify_eod_tasks_enabled"),
    ]);
    staff = staffData;
    stock = stockData;
    vendors = vendorsData;
    opening = openingData;
    closing = closingData;
    ownerWa = ownerWaData;
    punchoutEnabled = punchoutData !== "false";
    tasksEnabled = tasksData !== "false";
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title={isOwner ? "Profile & Settings" : "My Profile"} 
        subtitle={isOwner ? "Manage restaurant configurations and settings" : "Manage your account details and view operational records"} 
      />

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
                {isOwner ? "Owner / Admin" : (currentProfile.designation || "Staff")}
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
            <Button asChild size="sm" variant="default" className="gap-1 text-black bg-white">
              <Link href="/attendance">
                <Shield className="size-3.5" />
                Attendance Ledger
              </Link>
            </Button>
          </div>
        )}
      </Card>

      {/* Staff view with ProfileClient tabs, or Owner view with merged SettingsTabs */}
      {!isOwner ? (
        <div className="pt-2">
          <ProfileClient
            initialLeaves={leaves}
            initialDocuments={documents}
            allLeaves={headChef ? allLeaves : undefined}
            staffNames={headChef ? staffNames : undefined}
            myAttendance={myAttendance ? <MyAttendanceHistory data={myAttendance} /> : undefined}
            attendanceChild={
              <AttendanceClient
                staffList={[currentProfile]}
                currentProfile={currentProfile}
                initialPunches={punches}
              />
            }
          />
        </div>
      ) : (
        <div className="pt-2">
          <SettingsTabs
            sections={[
              {
                id: "staff",
                label: "Staff",
                content: (
                  <div className="space-y-4 animate-fade-in">
                    {!hasServiceRole() && (
                      <Card className="flex items-start gap-2 border-warning/30 bg-warning/10 p-3 text-sm text-warning">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        <span>
                          Add <code className="text-warm">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
                          to create accounts from here.
                        </span>
                      </Card>
                    )}
                    <Card className="p-4">
                      <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-content-secondary">
                        Add staff member
                      </h2>
                      <AddStaffForm />
                    </Card>
                    <Card className="divide-y divide-border">
                      {staff.map((s) => (
                        <div key={s.id} className="px-4 py-3.5 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex size-9 items-center justify-center rounded-full bg-white text-xs font-bold text-black">
                                {initials(s.name)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="flex items-center gap-2 text-sm font-semibold">
                                  {s.name}
                                  <Badge variant={s.role === "owner" ? "fire" : "default"}>
                                    {s.role === "owner" ? "Owner" : (s.designation || "Staff")}
                                  </Badge>
                                  {!s.is_active && <Badge variant="danger">inactive</Badge>}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {s.email && (
                                <ResetPassword email={s.email} action={sendPasswordReset} />
                              )}
                              <ToggleActive id={s.id} active={s.is_active} action={setStaffActive} />
                            </div>
                          </div>
                          
                          {s.role !== "owner" && (
                            <BiometricMappingForm
                              profileId={s.id}
                              initialPin={s.biometric_pin || ""}
                              initialName={s.biometric_name || ""}
                            />
                          )}
                        </div>
                      ))}
                    </Card>
                    <p className="px-1 text-xs text-content-secondary">
                      The key icon sends a password reset email. The switch
                      activates / deactivates an account.
                    </p>
                  </div>
                ),
              },
              {
                id: "stock",
                label: "Stock items",
                content: (
                  <div className="space-y-4 animate-fade-in">
                    <Card className="p-4">
                      <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-content-secondary">
                        Add stock item
                      </h2>
                      <AddStockItemForm />
                    </Card>
                    <Card className="divide-y divide-border">
                      {stock.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{item.name}</p>
                            {item.category && (
                              <p className="text-xs text-content-secondary">{item.category}</p>
                            )}
                          </div>
                          <ToggleActive id={item.id} active={item.is_active} action={toggleStockItem} />
                          <DeleteRow id={item.id} action={deleteStockItem} confirmLabel={`Remove "${item.name}"?`} />
                        </div>
                      ))}
                    </Card>
                  </div>
                ),
              },
              {
                id: "vendors",
                label: "Vendors",
                content: (
                  <div className="space-y-4 animate-fade-in">
                    <Card className="p-4">
                      <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-content-secondary">
                        Add vendor
                      </h2>
                      <AddVendorForm />
                    </Card>
                    <Card className="divide-y divide-border">
                      {vendors.map((v) => (
                        <div key={v.id} className="flex items-center gap-3 px-4 py-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold">{v.name}</p>
                            <p className="text-xs text-content-secondary">
                              {[v.supply_category, v.order_days, v.contact]
                                .filter(Boolean)
                                .join(" · ") || "No details"}
                            </p>
                          </div>
                          <ToggleActive id={v.id} active={v.is_active} action={toggleVendor} />
                          <DeleteRow id={v.id} action={deleteVendor} confirmLabel={`Remove "${v.name}"?`} />
                        </div>
                      ))}
                    </Card>
                  </div>
                ),
              },
              {
                id: "checklists",
                label: "Checklists",
                content: (
                  <div className="space-y-6 animate-fade-in">
                    <ChecklistConfig title="Opening checklist" type="opening" items={opening} />
                    <ChecklistConfig title="Closing checklist" type="closing" items={closing} />
                  </div>
                ),
              },
              {
                id: "whatsapp",
                label: "WhatsApp",
                content: (
                  <div className="space-y-4 animate-fade-in">
                    <Card className="p-4">
                      <h2 className="mb-1 text-sm font-bold uppercase tracking-wider text-content-secondary">
                        Report recipient
                      </h2>
                      <p className="mb-3 text-sm text-content-secondary">
                        The end-of-day report is sent here. Defaults to{" "}
                        <code className="text-warm">OWNER_WHATSAPP_NUMBER</code> if blank.
                      </p>
                      <WhatsAppForm current={ownerWa ?? ""} />
                    </Card>
                    <Card className="p-4">
                      <h2 className="mb-1 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-content-secondary">
                        <MessageCircle className="size-4" /> Test send
                      </h2>
                      <p className="mb-3 text-sm text-content-secondary">
                        Sends today&apos;s report right now to verify your WhatsApp setup.
                      </p>
                      <SendReportButton size="sm" />
                    </Card>
                  </div>
                ),
              },
              {
                id: "signature",
                label: "Signature",
                content: (
                  <div className="space-y-4 animate-fade-in">
                    <Card className="p-4">
                      <h2 className="mb-1 text-sm font-bold uppercase tracking-wider text-content-secondary">
                        Authorized Signature
                      </h2>
                      <p className="mb-3 text-sm text-content-secondary">
                        Upload your authorized signature image. This signature will be automatically used to sign salary slips and other official documents generated for your staff.
                      </p>
                      <OwnerSignatureForm initialSignature={currentProfile.signature_url ?? null} />
                    </Card>
                  </div>
                ),
              },
              {
                id: "notifications",
                label: "Notifications",
                content: (
                  <div className="space-y-6 animate-fade-in">
                    <section className="space-y-3">
                      <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-content-secondary">
                        <CalendarClock className="size-4" /> Scheduled notifications
                      </h2>
                      <ScheduleClient
                        groups={[
                          {
                            key: "notify_punchout_enabled",
                            title: "Attendance Punch-Out Reminders",
                            description: "Sent to all staff — reminding them to punch out before leaving",
                            triggerType: "punchout",
                            enabled: punchoutEnabled,
                            rounds: [
                              { label: "Round 1", time: "11:00 PM" },
                              { label: "Round 2", time: "11:15 PM" },
                              { label: "Round 3", time: "11:30 PM" },
                            ],
                          },
                          {
                            key: "notify_eod_tasks_enabled",
                            title: "EOD Task Reminders",
                            description: "Smart reminders for closing checklist, sales entry & closing balance — skipped if already done",
                            triggerType: "tasks",
                            enabled: tasksEnabled,
                            rounds: [
                              { label: "Check 1", time: "11:05 PM" },
                              { label: "Check 2", time: "11:18 PM" },
                              { label: "Check 3", time: "11:25 PM" },
                            ],
                          },
                        ]}
                      />
                    </section>
                    <section className="space-y-3">
                      <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-content-secondary">
                        <Bell className="size-4" /> Send custom notification
                      </h2>
                      <div className="max-w-lg">
                        <SendNotificationForm />
                      </div>
                    </section>
                  </div>
                ),
              },
            ]}
          />
        </div>
      )}
    </div>
  );
}

function ChecklistConfig({
  title,
  type,
  items,
}: {
  title: string;
  type: "opening" | "closing";
  items: import("@/lib/database.types").ChecklistItemConfig[];
}) {
  return (
    <div className="space-y-3">
      <Card className="p-4">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-content-secondary">
          {title}
        </h2>
        <AddChecklistItemForm type={type} />
      </Card>
      <Card className="divide-y divide-border">
        {items.length === 0 ? (
          <p className="px-4 py-3 text-sm text-content-secondary">
            Using built-in defaults. Add an item to customise.
          </p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm">{item.label}</p>
                <p className="text-xs text-content-secondary">{item.section}</p>
              </div>
              <ToggleActive id={item.id} active={item.is_active} action={toggleChecklistItem} />
              <DeleteRow id={item.id} action={deleteChecklistItem} confirmLabel={`Remove "${item.label}"?`} />
            </div>
          ))
        )}
      </Card>
    </div>
  );
}

// Inline fallback button definition
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
