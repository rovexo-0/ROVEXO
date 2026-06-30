import { Suspense } from "react";
import { NotificationDetailPage } from "@/features/notifications/components/NotificationDetailPage";
import { NotificationsEngineNotificationPanel } from "@/features/notifications-engine/NotificationsEngineNotificationPanel";
import { getNotificationsEngineNotificationContext } from "@/lib/notifications-engine/reader";
import { getProfile } from "@/lib/profile/data";

type NotificationDetailRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function NotificationDetailRoute({ params }: NotificationDetailRouteProps) {
  const { id } = await params;
  const profile = await getProfile();
  const engineContext = await getNotificationsEngineNotificationContext(id, profile.id);

  return (
    <>
      {engineContext ? (
        <Suspense fallback={null}>
          <NotificationsEngineNotificationPanel context={engineContext} />
        </Suspense>
      ) : null}
      <NotificationDetailPage id={id} />
    </>
  );
}
