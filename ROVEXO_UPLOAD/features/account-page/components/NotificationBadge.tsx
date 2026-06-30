import { formatNotificationBadgeCount } from "@/lib/notifications/utils";

type NotificationBadgeProps = {
  count: number;
  className?: string;
};

export function NotificationBadge({ count, className }: NotificationBadgeProps) {
  const label = formatNotificationBadgeCount(count);
  if (!label) return null;

  return (
    <span className={["account-notification-badge", className].filter(Boolean).join(" ")} aria-hidden>
      {label}
    </span>
  );
}
