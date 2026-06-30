import { EmptyState } from "@/components/ui/EmptyState";

export function NotificationsEmptyState() {
  return (
    <EmptyState
      premiumIllustrationId="notifications"
      title="No notifications yet"
      description="Updates about orders, messages, and saved searches will appear here."
    />
  );
}
