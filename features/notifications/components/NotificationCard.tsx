import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { formatNotificationTime } from "@/lib/notifications/utils";
import type { Notification } from "@/lib/notifications/types";
import { NotificationTypeIcon, iconToneClass } from "@/features/notifications/icons";

type NotificationCardProps = {
  notification: Notification;
};

export function NotificationCard({ notification }: NotificationCardProps) {
  const showAvatar = Boolean(notification.avatarName);

  return (
    <Card
      padding="sm"
      interactive
      className={cn(
        "min-h-[72px] max-h-[84px] shadow-ds-soft",
        !notification.read && "border-primary/20 bg-primary/[0.03]",
      )}
    >
      <div className="flex items-center gap-ds-3">
        {showAvatar ? (
          <Avatar
            src={notification.avatarUrl}
            alt={notification.avatarName ?? notification.title}
            name={notification.avatarName ?? notification.title}
            size="md"
          />
        ) : (
          <span
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-ds-full",
              iconToneClass(notification.icon),
            )}
          >
            <NotificationTypeIcon icon={notification.icon} className="h-5 w-5" />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-ds-2">
            <p className="truncate text-sm font-semibold text-text-primary">{notification.title}</p>
            <div className="flex shrink-0 items-center gap-ds-2">
              <time dateTime={notification.createdAt} className="text-xs text-text-muted">
                {formatNotificationTime(notification.createdAt)}
              </time>
              {!notification.read && (
                <span className="h-2 w-2 rounded-ds-full bg-primary" aria-label="Unread notification" />
              )}
            </div>
          </div>

          <p className="mt-0.5 line-clamp-2 text-sm text-text-secondary">{notification.subtitle}</p>
        </div>
      </div>
    </Card>
  );
}
