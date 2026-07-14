import { EmptyState } from "@/components/ui/EmptyState";

type NotificationsEmptyStateProps = {
  variant?: "all" | "orders";
};

export function NotificationsEmptyState({ variant = "all" }: NotificationsEmptyStateProps) {
  if (variant === "orders") {
    return (
      <EmptyState
        premiumIllustrationId="notifications"
        title="No Order Notifications"
        description="Order updates will appear here."
      />
    );
  }

  return (
    <EmptyState
      premiumIllustrationId="notifications"
      title="No Notifications Yet"
      description="Your notifications will appear here."
    />
  );
}
