import { notFound } from "next/navigation";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { cn } from "@/lib/cn";
import { NotificationTypeIcon, iconToneClass } from "@/features/notifications/icons";
import { formatNotificationTime } from "@/lib/notifications/utils";
import { fetchNotificationById } from "@/lib/notifications/queries";
import {
  CanonicalCard,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";

type NotificationDetailPageProps = {
  id: string;
};

export async function NotificationDetailPage({ id }: NotificationDetailPageProps) {
  const notification = await fetchNotificationById(id);

  if (!notification || notification.type !== "system") {
    notFound();
  }

  const icon = (
    <span
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-ds-full",
        iconToneClass(notification.icon),
      )}
    >
      <NotificationTypeIcon icon={notification.icon} className="h-5 w-5" />
    </span>
  );

  return (
    <AccountCanonicalShell
      title="Details"
      backHref="/notifications"
      backLabel="Notifications"
      showHeaderTitle
      showBottomNav={false}
    >
      <div className="ac-canonical flex w-full flex-col gap-ds-4 pb-ds-5">
        <CanonicalSection title="Notification">
          <CanonicalCard variant="list">
            <CanonicalMenuRow
              title={notification.title}
              description={notification.subtitle}
              icon={icon}
              showChevron={false}
            />
            <CanonicalMenuRow
              title="Received"
              value={formatNotificationTime(notification.createdAt)}
              showChevron={false}
            />
            {notification.detail ? (
              <CanonicalMenuRow
                title="Message"
                description={notification.detail}
                showChevron={false}
              />
            ) : null}
            {notification.href !== `/notifications/${notification.id}` ? (
              <CanonicalMenuRow title="Open Related Page" href={notification.href} />
            ) : null}
          </CanonicalCard>
        </CanonicalSection>
      </div>
    </AccountCanonicalShell>
  );
}
