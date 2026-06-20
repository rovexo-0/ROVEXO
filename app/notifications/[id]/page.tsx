import { NotificationDetailPage } from "@/features/notifications/components/NotificationDetailPage";

type NotificationDetailRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function NotificationDetailRoute({ params }: NotificationDetailRouteProps) {
  const { id } = await params;

  return <NotificationDetailPage id={id} />;
}
