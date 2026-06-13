import { requireOwner } from "@/lib/auth";
import { getAppSetting } from "@/lib/data/settings";
import { PageHeader } from "@/components/page-header";
import { SendNotificationForm } from "./send-form";
import { ScheduleClient } from "./schedule-client";
import { Bell, CalendarClock } from "lucide-react";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  await requireOwner();

  const [punchoutEnabled, tasksEnabled] = await Promise.all([
    getAppSetting("notify_punchout_enabled"),
    getAppSetting("notify_eod_tasks_enabled"),
  ]);

  const scheduleGroups = [
    {
      key: "notify_punchout_enabled",
      title: "Attendance Punch-Out Reminders",
      description: "Sent to all staff — reminding them to punch out before leaving",
      triggerType: "punchout",
      enabled: punchoutEnabled !== "false",
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
      enabled: tasksEnabled !== "false",
      rounds: [
        { label: "Check 1", time: "11:05 PM" },
        { label: "Check 2", time: "11:18 PM" },
        { label: "Check 3", time: "11:25 PM" },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="Notifications" subtitle="Manage scheduled alerts and send custom messages" />

      {/* Scheduled notifications */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-content-secondary">
          <CalendarClock className="size-4" /> Scheduled notifications
        </h2>
        <ScheduleClient groups={scheduleGroups} />
      </section>

      {/* Manual send */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-content-secondary">
          <Bell className="size-4" /> Send custom notification
        </h2>
        <div className="max-w-lg">
          <SendNotificationForm />
        </div>
      </section>
    </div>
  );
}
