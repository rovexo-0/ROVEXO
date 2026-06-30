import { NotificationPreferencesPage } from "@/features/notifications/components/NotificationPreferences";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = privatePageMetadata;

export default function NotificationPreferencesRoute() {
  return <NotificationPreferencesPage />;
}
