import { NotificationCenter } from "@/features/notifications/components/NotificationCenter";
import { fetchNotifications } from "@/lib/notifications/queries";
import { requireAuthContext } from "@/lib/auth/session";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = privatePageMetadata;

export default async function NotificationsRoute() {
  await requireAuthContext();
  const notifications = await fetchNotifications();

  return <NotificationCenter initialNotifications={notifications} />;
}
