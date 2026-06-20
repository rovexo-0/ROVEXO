import { NotificationsPage } from "@/features/notifications/components/NotificationsPage";
import { fetchNotifications } from "@/lib/notifications/queries";

export default async function NotificationsRoute() {
  const notifications = await fetchNotifications();

  return <NotificationsPage initialNotifications={notifications} />;
}
