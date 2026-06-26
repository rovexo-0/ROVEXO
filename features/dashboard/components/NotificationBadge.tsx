import { formatNotificationBadgeCount } from "@/lib/notifications/utils";

type NotificationBadgeProps = {
  count: number;
  className?: string;
  tone?: "danger" | "success";
};

export function NotificationBadge({ count, className, tone = "danger" }: NotificationBadgeProps) {
  const label = formatNotificationBadgeCount(count);
  if (!label) return null;

  return (
    <span
      className={[
        "dash-v1-badge pointer-events-none absolute",
        tone === "danger" ? "dash-v1-badge--danger" : "dash-v1-badge--success",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden
    >
      {label}
    </span>
  );
}
