import { Suspense } from "react";
import { NotificationsEngineHub } from "@/features/notifications-engine/NotificationsEngineHub";
import { NOTIFICATIONS_ENGINE_MODULES } from "@/lib/notifications-engine/registry";
import {
  getNotificationsEngineAnalyticsForUser,
  getNotificationsEngineContext,
  getPublicNotificationsEngineConfig,
  listNotificationsEngineSummaries,
} from "@/lib/notifications-engine/reader";
import { fetchNotifications } from "@/lib/notifications/queries";
import { getProfile } from "@/lib/profile/data";

export default async function NotificationsRoute() {
  const profile = await getProfile();
  const [config, context, summaries, analytics, notifications] = await Promise.all([
    getPublicNotificationsEngineConfig(),
    getNotificationsEngineContext(profile.id),
    listNotificationsEngineSummaries(profile.id),
    getNotificationsEngineAnalyticsForUser(profile.id),
    fetchNotifications(),
  ]);

  return (
    <Suspense fallback={<div className="ne-hub p-ds-5">Loading notifications…</div>}>
      <NotificationsEngineHub
        config={config}
        context={context}
        modules={NOTIFICATIONS_ENGINE_MODULES}
        summaries={summaries}
        analytics={analytics}
        notifications={notifications}
      />
    </Suspense>
  );
}

export async function generateMetadata() {
  return {
    title: "Notifications | ROVEXO",
    description: "ROVEXO Notifications Engine — real-time alerts, badges, preferences, and delivery analytics.",
    robots: { index: false, follow: false },
  };
}
