import { NotificationsInboxV1 } from "@/features/notifications/components/NotificationsInboxV1";

export const dynamic = "force-dynamic";

export default function NotificationsRoute() {
  return <NotificationsInboxV1 />;
}

export async function generateMetadata() {
  return {
    title: "Notifications | ROVEXO",
    description: "ROVEXO Notifications — real-time alerts and marketplace updates.",
    robots: { index: false, follow: false },
  };
}
