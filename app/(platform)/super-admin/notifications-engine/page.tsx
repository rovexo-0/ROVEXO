import { NotificationsEngineAdmin } from "@/features/super-admin/notifications-engine/NotificationsEngineAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getNotificationsEngineSnapshot } from "@/lib/notifications-engine/reader";

export default async function SuperAdminNotificationsEnginePage() {
  const snapshot = await getNotificationsEngineSnapshot();

  return (
    <>
      <SuperAdminPageHeader
        title="Notifications Engine"
        description="Enterprise real-time notification system — channels, events, badges, preferences, and integrations."
      />
      <NotificationsEngineAdmin initialSnapshot={snapshot} />
    </>
  );
}

export async function generateMetadata() {
  return {
    title: "Notifications Engine | ROVEXO",
    robots: { index: false, follow: false },
  };
}
