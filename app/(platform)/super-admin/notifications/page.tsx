import { SuperAdminNotificationsPanel } from "@/features/super-admin/components/SuperAdminNotificationsPanel";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";

export default function SuperAdminNotificationsPage() {
  return (
    <>
      <SuperAdminPageHeader
        title="Notifications"
        description="Broadcast push, in-app, and email notifications to users, sellers, or businesses."
      />
      <SuperAdminNotificationsPanel />
    </>
  );
}
