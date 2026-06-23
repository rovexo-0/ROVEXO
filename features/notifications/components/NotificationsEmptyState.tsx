import { EmptyState } from "@/components/ui/EmptyState";
import { BellIcon } from "@/features/notifications/icons";

export function NotificationsEmptyState() {
  return (
    <EmptyState
      icon={<BellIcon className="h-7 w-7" />}
      title="You're all caught up"
      description="No new notifications right now."
      actionLabel="Browse listings"
      actionHref="/"
    />
  );
}
