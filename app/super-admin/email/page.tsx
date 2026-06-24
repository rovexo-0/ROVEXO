import { SuperAdminNotificationsPanel } from "@/features/super-admin/components/SuperAdminNotificationsPanel";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";

export default function SuperAdminEmailPage() {
  return (
    <>
      <SuperAdminPageHeader title="Email Centre" description="Broadcast email and notification delivery." />
      <SuperAdminNotificationsPanel />
    </>
  );
}
