import { listNotifications, getNotificationById } from "@/lib/notifications/store";
import { requireAuthContext } from "@/lib/auth/session";

export async function fetchNotifications() {
  const { user } = await requireAuthContext();
  return listNotifications(user.id);
}

export async function fetchNotificationById(id: string) {
  const { user } = await requireAuthContext();
  return getNotificationById(id, user.id);
}
