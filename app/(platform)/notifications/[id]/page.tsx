import { NotificationDetailPage } from "@/features/notifications/components/NotificationDetailPage";
import { getProfile } from "@/lib/profile/data";

type NotificationDetailRouteProps = {
  params: Promise<{ id: string }>;
};

/** Consumer notification detail — One Product shell only (no engine glass panel). */
export default async function NotificationDetailRoute({ params }: NotificationDetailRouteProps) {
  const { id } = await params;
  await getProfile();
  return <NotificationDetailPage id={id} />;
}
