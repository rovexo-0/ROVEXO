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
        "rx-dash-badge pointer-events-none absolute",
        tone === "danger" ? "rx-dash-badge--danger" : "rx-dash-badge--success",
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
