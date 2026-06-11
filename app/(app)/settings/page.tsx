import { AlertTriangle, MessageCircle } from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { getStaff } from "@/lib/data/profiles";
import { getAllStockItems } from "@/lib/data/stock";
import { getAllVendors } from "@/lib/data/vendors";
import { getAllChecklistItems, getAppSetting } from "@/lib/data/settings";
import { hasServiceRole } from "@/lib/supabase/env";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";
import { SettingsTabs } from "@/components/settings/tabs";
import {
  AddStaffForm,
  AddStockItemForm,
  AddVendorForm,
  AddChecklistItemForm,
  WhatsAppForm,
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
} from "./actions";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireOwner();
  const [staff, stock, vendors, opening, closing, ownerWa] = await Promise.all([
    getStaff(),
    getAllStockItems(),
    getAllVendors(),
    getAllChecklistItems("opening"),
    getAllChecklistItems("closing"),
    getAppSetting("owner_whatsapp_number"),
  ]);

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage staff, items, vendors & config" />
      <SettingsTabs
        sections={[
          {
            id: "staff",
            label: "Staff",
            content: (
              <div className="space-y-4">
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
                          <div className="min-w-0">
                            <p className="flex items-center gap-2 text-sm font-semibold">
                              {s.name}
                              <Badge variant={s.role === "owner" ? "fire" : "default"}>
                                {s.role}
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
              <div className="space-y-4">
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
              <div className="space-y-4">
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
              <div className="space-y-6">
                <ChecklistConfig title="Opening checklist" type="opening" items={opening} />
                <ChecklistConfig title="Closing checklist" type="closing" items={closing} />
              </div>
            ),
          },
          {
            id: "whatsapp",
            label: "WhatsApp",
            content: (
              <div className="space-y-4">
                <Card className="p-4">
                  <h2 className="mb-1 text-sm font-bold uppercase tracking-wider text-content-secondary">
                    Report recipient
                  </h2>
                  <p className="mb-3 text-sm text-content-secondary">
                    The end-of-day report is sent here. Defaults to{" "}
                    <code className="text-warm">OWNER_WHATSAPP_NUMBER</code> if blank.
                  </p>
                  <WhatsAppForm current={ownerWa} />
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
        ]}
      />
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
