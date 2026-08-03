import { redirect } from "next/navigation";

/**
 * Notification Preferences redirects to the singular Notifications Settings surface.
 * Cluster 8 emit still uses notification_preferences (synced from Notification Engine v1.0).
 */
export default function NotificationPreferencesRoute() {
  redirect("/notifications/settings");
}
