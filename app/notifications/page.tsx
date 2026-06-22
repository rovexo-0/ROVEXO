import { NotificationsPage } from "@/features/notifications/components/NotificationsPage";
import { fetchNotifications } from "@/lib/notifications/queries";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = privatePageMetadata;

export default async function NotificationsRoute() {
  const notifications = await fetchNotifications();

  return <NotificationsPage initialNotifications={notifications} />;
}
