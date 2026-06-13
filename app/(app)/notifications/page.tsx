import { requireOwner } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { SendNotificationForm } from "./send-form";

export const metadata = { title: "Send notification" };

export default async function NotificationsPage() {
  await requireOwner();
  return (
    <div>
      <PageHeader
        title="Send Notification"
        subtitle="Push a message to staff or everyone"
      />
      <div className="mt-6 max-w-lg">
        <SendNotificationForm />
      </div>
    </div>
  );
}
